# Jenkins: every push to `main` goes live automatically

Pipeline: [`deploy/ec2/Jenkinsfile`](Jenkinsfile).

```
git push origin main
  └─► Jenkins (GitHub webhook, or its 2-minute check)
        1. Detect changes since the last successful deploy          (deploy/ec2/detect-changes.sh)
        2. Test   backend: mvn verify on the changed services   website: tsc type-check + oxlint
        3. Build  only the changed parts into one release file
        4. [ "Deploy to live?" only if REQUIRE_APPROVAL is ticked ]
        5. Deploy on the server                                       (deploy/ec2/deploy.sh)
             database dump first (MySQL keeps running) -> services replaced ONE AT A TIME -> website swapped in one step
        6. Smoke test on the server: the real encrypted API flow     (deploy/ec2/smoke-test.mjs)
             fails -> automatic rollback to the previous version, build turns red
        7. hunhar-doctor report + the same smoke test through https://www.hunhar.in
```

**What a push deploys**

| You changed | Jenkins deploys | Visitors notice |
|---|---|---|
| `Hunhar-frontend/…` | the website only (~12 MB release) | nothing — swapped in one step, no service restarts |
| `Hunhar-backend/<service>/…` | only that service | only that service's features pause ~45 s while it restarts |
| `Hunhar-backend/common-lib/…` or `Hunhar-backend/pom.xml` | all 5 services, one at a time | each part pauses in turn; the site never goes down all at once |
| `deploy/ec2/…` | the server scripts (nothing restarted) | nothing |
| docs, README, other files | nothing (build is green, "nothing to deploy") | nothing |

Force a scope: **Build with Parameters → DEPLOY_SCOPE** = `website` / `backend` / `everything`.

**Safety net**
- Tests or the build fail → nothing reaches the server.
- A replaced service does not report UP within 3 minutes → its previous version is put back at once and the deploy stops.
- The smoke test fails after the deploy → `sudo hunhar-deploy --rollback` runs automatically (services + website).
- Before every backend deploy the databases are dumped to `/opt/hunhar/backups/pre-deploy-*.sql.gz` (last 5 kept).
  Restore one: `gunzip -c /opt/hunhar/backups/pre-deploy-<time>.sql.gz | sudo mysql`
- Undo the last deploy by hand: `sudo hunhar-deploy --rollback`
- Only the **`main`** branch deploys. Secrets stay in `/opt/hunhar/.env` on the server.

> There are no unit tests in the project yet, so "Test backend" proves the code compiles and packages;
> add tests under `Hunhar-backend/<service>/src/test/java` and they run (and can fail the deploy) automatically.

> The root `Jenkinsfile` is a different, older job: it builds and runs everything on the Jenkins machine (testing only).

> The root `Jenkinsfile` is a different, older job: it builds and runs everything on the Jenkins machine (testing only).

---

## 0. First the live server, by hand (once)

Jenkins does updates, not the first install. Do [README.md](README.md) first:
`sudo bash install.sh --bucket <bucket>` → fill `/opt/hunhar/.env` → `sudo bash install.sh`.

## 1. A Jenkins server GitHub can reach

GitHub's webhook must reach Jenkins over the internet, so Jenkins gets its own small EC2.
**Do not put Jenkins on the live t3.medium** — the 5 services and MySQL already use its memory.

1. **EC2 → Launch instance**: Ubuntu 24.04, **t3.small** (t3.medium builds faster), 30 GB, same key pair is fine.
   Security group `hunhar-jenkins`: 22 from **My IP**, 80 and 443 from **Anywhere**.
2. **Elastic IP** → associate it. **DNS**: `A  jenkins  → <Jenkins Elastic IP>`.
3. **Let Jenkins SSH into the live server**: EC2 → Security Groups → the *live* server's group → Inbound rules →
   Add: **SSH 22, source = the `hunhar-jenkins` security group** (or the Jenkins Elastic IP `/32`).
4. Copy the repo's `deploy/jenkins` folder to the Jenkins server and run it (from your PC, PowerShell):
   ```bash
   scp -i hunhar.pem -r E:\Hunhar\deploy\jenkins ubuntu@<jenkins-ip>:~
   ssh -i hunhar.pem ubuntu@<jenkins-ip>
   sudo bash ~/jenkins/setup-jenkins-server.sh --email you@example.com
   ```
   It installs Java 21, Maven, Node 22, Git, Jenkins LTS (only on 127.0.0.1), nginx + HTTPS for `jenkins.hunhar.in`.
5. Open **https://jenkins.hunhar.in**, paste `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`,
   **Install suggested plugins** (includes Git, GitHub, Pipeline, Credentials Binding, SSH Credentials, Timestamper),
   create your admin user. **Manage Jenkins → System → Jenkins URL** = `https://jenkins.hunhar.in/`.

*No second server?* Jenkins on your PC works too ([docs/JENKINS.md](../../docs/JENKINS.md)), but GitHub cannot
call it: it picks up pushes with the 2-minute poll instead, only while the PC is on, and the live server's port 22
must allow your home IP.

## 2. Credentials (Manage Jenkins → Credentials → System → Global → Add Credentials)

| ID (type exactly) | Kind | Value |
|---|---|---|
| `hunhar-ec2-ssh` | SSH Username with private key | Username `hunhar`; Private Key → Enter directly → the whole `hunhar.pem` |
| `hunhar-ec2-host` | Secret text | The **live** server's Elastic IP |
| `github-hunhar` | Username with password | GitHub username + a fine-grained token (repo `WCVFW/Hunhar`, *Contents: Read*, *Webhooks: Read*) |

## 3. The job

1. **New Item** → `hunhar-live` → **Pipeline** → OK.
2. **Pipeline**: *Pipeline script from SCM* → Git → `https://github.com/WCVFW/Hunhar.git`, credentials `github-hunhar`,
   Branch `*/main`, Script Path **`deploy/ec2/Jenkinsfile`** → Save.
3. **Build Now** once. The first run reads the Jenkinsfile and turns on its triggers and parameters
   (from then on the button is *Build with Parameters*). Untick `CHECK_PUBLIC_URLS` until DNS + HTTPS work.

## 4. GitHub webhook (instant deploys)

GitHub → `WCVFW/Hunhar` → **Settings → Webhooks → Add webhook**:

| Field | Value |
|---|---|
| Payload URL | `https://jenkins.hunhar.in/github-webhook/` (the last `/` matters) |
| Content type | `application/json` |
| Which events | **Just the push event** |
| Active | ticked |

Save. GitHub sends a ping; **Recent Deliveries** should show a green tick (HTTP 200).
Now `git push origin main` → a build starts within seconds → the site updates in about 5–8 minutes.

## 5. Every day

```bash
git add -A
git commit -m "Describe the change"
git push origin main          # Jenkins builds, deploys and checks — watch it at https://jenkins.hunhar.in/job/hunhar-live/
```
- Want to look before it goes live? *Build with Parameters* → tick **REQUIRE_APPROVAL**, then click **Deploy to live** when asked.
- Email when a build fails: Manage Jenkins → System → E-mail Notification (SMTP), then add `mail` to the job's post-failure — optional.

## 6. Rollback

```bash
ssh -i hunhar.pem hunhar@<live-ip>
ls -1dt ~/releases/hunhar-release-*/            # newest first
sudo bash ~/releases/<previous-release>/install.sh
```
Database changes are not rolled back — restore a backup for that (`sudo hunhar-db-restore --list`).
Then `git revert` the bad commit and push, so the next automatic deploy does not bring it back.

## 7. If a build fails

| Stage | Message | Fix |
|---|---|---|
| (no build after a push) | webhook delivery red in GitHub | Payload URL must end with `/github-webhook/`; Jenkins must be on HTTPS and port 443 open |
| (no build after a push) | delivery green, still nothing | Run the job once by hand (step 3.3) so its triggers are registered |
| Checkout | `Authentication failed` | `github-hunhar` token expired or lacks *Contents: Read* |
| Build release | `mvn` / `npm` not found | Re-run `setup-jenkins-server.sh`; restart Jenkins |
| Build release | `No such DSL method 'githubPush'` | Install the **GitHub** plugin (Manage Jenkins → Plugins) |
| Deploy | `Connection timed out` | Live server's port 22 does not allow the Jenkins server (step 1.3) |
| Deploy | `Permission denied (publickey)` | `hunhar-ec2-ssh` must be user `hunhar` + the live instance's `.pem` |
| Deploy | `This server was never set up` | Step 0 |
| Deploy | `<service> NOT UP` + doctor output | Read the FAIL lines; on the server `journalctl -u hunhar@<service> -n 100 --no-pager` |
| Check | `FAILED https://www.hunhar.in` | DNS/HTTPS for the live site not ready — untick `CHECK_PUBLIC_URLS` until then |
