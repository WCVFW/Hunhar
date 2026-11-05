# Jenkins: build and run Hunhar

> This job builds and runs everything **on the Jenkins machine** (testing).
> To deploy to the **live EC2 server** (www.hunhar.in), use the separate job in
> [deploy/ec2/JENKINS.md](../deploy/ec2/JENKINS.md) (Script Path `deploy/ec2/Jenkinsfile`).

The pipeline is defined in [`Jenkinsfile`](../Jenkinsfile) at the repository root. One run:

1. **Checkout** — pulls the repo.
2. **Build** (parallel)
   - Backend: `mvn -B clean package` in `Hunhar-backend` → 5 runnable JARs.
   - Frontend: `npm ci && npm run build` in `Hunhar-frontend` → `dist/`.
3. **Archive** — the 5 service JARs and `hunhar-frontend-dist.zip` are attached to the build.
4. **Deploy** (when `DEPLOY` is ticked) — writes the backend `.env` from a Jenkins secret, restarts all services with `run.ps1` (Windows) or `run.sh` (Linux), and publishes the frontend.
5. **Health check** — waits until all 5 services report `UP` on `/actuator/health`, plus the frontend on port 5173.
6. **Smoke test** — a wrong-password login through the gateway must return "Invalid email or password", and an unauthenticated wallet call must return 401.

If a stage fails, the console shows the last 40 lines of every service log.

| Port | What |
|---|---|
| **8090** | Jenkins (8080 is taken by the API gateway) |
| 8080 | API gateway (the frontend calls this) |
| 8081–8084 | identity, project, billing, engagement services |
| 5173 | Frontend (`vite preview`) |
| 3306 | MySQL |

---

## 1. Install Jenkins (once)

**Prerequisites on the Jenkins machine:** Java 17, Maven 3.9+, Node.js 20+ (22 recommended), MySQL 8 running, Git.

### Windows

1. Download the **Windows LTS installer (.msi)** from https://www.jenkins.io/download/.
2. In the installer:
   - Choose **Run service as LocalSystem**, or use your own account if MySQL, Maven and Node are only on your user PATH.
   - Set the port to **8090** and click **Test Port**.
   - Point it at your JDK 17 folder.
3. When it finishes, open **http://localhost:8090**.

If Jenkins was already installed on 8080, change the port. Edit `C:\Program Files\Jenkins\jenkins.xml`, replace `--httpPort=8080` with `--httpPort=8090`, then restart the service:

```bash
powershell -Command "Restart-Service jenkins"
```

### Linux (Ubuntu/Debian)

```bash
sudo apt install -y openjdk-17-jdk maven git && curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt install -y nodejs
```

Then install Jenkins LTS following https://www.jenkins.io/doc/book/installing/linux/. To set the port, run `sudo systemctl edit jenkins`, add:

```
[Service]
Environment="JENKINS_PORT=8090"
```

Then restart:

```bash
sudo systemctl restart jenkins
```

### Docker (any OS)

```bash
docker run -d --name jenkins -p 8090:8080 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts-jdk17
```

The plain image has no Maven or Node. Either install them in the container, or use a native install as above.

## 2. First login

1. Open **http://localhost:8090** (from another machine, use `http://<server-ip>:8090` and allow port 8090 in the firewall).
2. Paste the initial admin password. Find it here:
   - Windows: `C:\ProgramData\Jenkins\.jenkins\secrets\initialAdminPassword`
   - Linux: `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`
   - Docker: `docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword`
3. Choose **Install suggested plugins**.
4. Go to **Manage Jenkins → Plugins → Available** and install **Pipeline Utility Steps**, which the `zip` step needs.
5. Create your Jenkins admin user.

## 3. Add the secrets (once)

The pipeline reads every backend secret from **one secret file**, so nothing sensitive is in Git.

1. Copy [`Hunhar-backend/.env.example`](../Hunhar-backend/.env.example) to a local file and fill in real values:
   - DB credentials
   - `JWT_SECRET`, at least 32 random characters, the same for every service
   - `INTERNAL_API_KEY`
   - SMTP `MAIL_*`
   - `ADMIN_*`
   - `RAZORPAY_*`
   - `PAYMENTS_ALLOW_MOCK=false` in production
2. Go to **Manage Jenkins → Credentials → System → Global credentials → Add Credentials**:
   - Kind: **Secret file**
   - File: upload the filled `.env`
   - ID: **`hunhar-backend-env`** (must match exactly)
3. If the repository is private, also add a **Username with password** credential: your GitHub username plus a personal access token.

## 4. Create the pipeline job

1. **Dashboard → New Item** → name it `hunhar` → choose **Pipeline** → OK.
2. Under **Pipeline**, set:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: `https://github.com/WCVFW/Hunhar.git`
   - Credentials: the GitHub credential, if the repo is private
   - Branch: `*/main`
   - Script Path: **`Jenkinsfile`** (the root one; `Hunhar-backend/Jenkinsfile` is the older backend-only pipeline)
3. Optional, under **Build Triggers**:
   - **GitHub hook trigger for GITScm polling** builds on every push. Add a webhook in GitHub at `http://<jenkins-host>:8090/github-webhook/`.
   - **Poll SCM** with `H/5 * * * *` checks for new commits every 5 minutes.
4. Click **Save**.

## 5. Build and run

1. Open the `hunhar` job → **Build with Parameters**.

| Parameter | Default | Meaning |
|---|---|---|
| `RUN_TESTS` | off | Run Maven unit tests |
| `DEPLOY` | on | Restart services and publish the frontend on this machine |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Gateway URL the browser will call. On a server, use `http://<server-ip>:8080` or your API domain |
| `FRONTEND_DEPLOY_DIR` | empty | If set (e.g. `/var/www/hunhar` or `C:\inetpub\hunhar`), `dist/` is copied there for nginx or IIS. If empty, the frontend runs with `vite preview` on port 5173 |

2. Click **Build**. The first build downloads Maven and npm dependencies (about 5–10 minutes); later builds take 2–4.
3. Follow the build:
   - **Console Output** shows the log.
   - **Pipeline Overview** (or the Stage View plugin) shows stage progress.
4. When the build is green, open the app:
   - Frontend: **http://localhost:5173**, or the server IP / your nginx domain.
   - Log in as the admin set in `ADMIN_EMAIL` / `ADMIN_PASSWORD`; it is created on the first start.
   - Gateway health: http://localhost:8080/actuator/health
5. The build page lists the **artifacts** (JARs and `hunhar-frontend-dist.zip`) for manual deployment.

The services keep running after the build finishes, because the pipeline sets `JENKINS_NODE_COOKIE` / `BUILD_ID=dontKillMe`. The next build stops and restarts them.

## 6. Day-to-day commands on the server

```bash
cd Hunhar-backend && ./run.sh status
```

On Windows, use `.\run.ps1 -Action status`, `-Action stop` or `-Action restart`. Logs are in `Hunhar-backend/logs/<service>.log`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `No such DSL method 'zip'` | Install the **Pipeline Utility Steps** plugin |
| `Could not find credentials entry with ID 'hunhar-backend-env'` | Create the Secret file credential with exactly that ID (step 3) |
| `mvn` / `npm` not recognized | Add Maven and Node to the PATH of the account the Jenkins service runs as, or configure them under **Manage Jenkins → Tools** |
| Health check times out on a service | Read the log tail printed at the end of the console output. Usually MySQL is down or a DB password is wrong |
| Port 8080 already in use when starting Jenkins | Jenkins must use **8090**; the gateway owns 8080 |
| Frontend loads but API calls fail | Rebuild with `VITE_API_BASE_URL` set to the address the browser can reach (not `localhost` when viewed from another machine) |
| Services stop when the build ends | Make sure the agent honours `BUILD_ID=dontKillMe`. On Windows, prefer running Jenkins as a service |
