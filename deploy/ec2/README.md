# Hunhar on AWS EC2 (website + backend + MySQL on one instance)

```
Browser ──https──► hunhar.in      ─► nginx :443 ─► 301 to www.hunhar.in
        ├─https──► www.hunhar.in  ─► nginx :443 ─► /var/www/hunhar (React build)
        └─https──► api.hunhar.in  ─► nginx :443 ─► api-gateway :8080 ─► identity :8081
                                                                   ├─► project  :8082
                                                                   ├─► billing  :8083
                                                                   └─► engagement :8084
                                     all services ─► MySQL 8 on 127.0.0.1:3306 (same instance)
Every night 02:00 IST: mysqldump ─► s3://<bucket>/mysql-backups/  (last 7 days kept)
```

## Quick path: one release file

On your PC (Git Bash), build everything into one file:
```bash
bash deploy/ec2/build-release.sh        # -> release/hunhar-release-<date>-<time>.tar.gz
```
Copy it to the server and run the installer (after steps 1–3 below):
```bash
scp -i hunhar.pem release/hunhar-release-*.tar.gz ubuntu@<elastic-ip>:~
ssh -i hunhar.pem ubuntu@<elastic-ip>
tar -xzf hunhar-release-*.tar.gz && cd hunhar-release-*/
sudo bash install.sh --bucket hunhar-db-backups   # first time: sets up the server, then asks you to fill /opt/hunhar/.env
sudo nano /opt/hunhar/.env
sudo bash install.sh                               # starts backend + publishes website
```
For every later update: build a new file, copy it, `tar -xzf`, `cd` into it, `sudo bash install.sh`.
No Git, Maven or Node is needed on the server. Then continue with step 4 (DNS) and step 8 (HTTPS).

The sections below explain each step, and the alternative of building on the server from a Git clone (`hunhar-deploy`).

| File | What it does |
|---|---|
| `setup-server.sh` | One-time server setup: Java 17, Maven, Node 22, MySQL, nginx, certbot, AWS CLI, services, backup timer |
| `deploy.sh` | Installed as `hunhar-deploy`: pull, build backend + website, restart, publish, health check |
| `systemd/` | `hunhar@<service>` units, `hunhar.target`, nightly backup timer |
| `nginx/hunhar.conf` | `www.hunhar.in` website, `hunhar.in` → `www` redirect, `api.hunhar.in` → gateway (WebSocket included, `/actuator` hidden) |
| `mysql/zz-hunhar.cnf` | MySQL bound to localhost, memory sized for 4 GB |
| `backup/` | `hunhar-db-backup` and `hunhar-db-restore` |
| `aws/` | IAM policy for the instance role, S3 lifecycle rule |

---

## 1. S3 bucket for backups (AWS console, region **ap-south-1 Mumbai**)

1. **S3 → Create bucket**, e.g. `hunhar-db-backups` (the name must be unique worldwide).
   Keep **Block all public access** on. Keep versioning **off**. Default encryption SSE-S3.
2. Safety net so nothing older than 8 days survives even if the script ever fails to prune:
   ```bash
   aws s3api put-bucket-lifecycle-configuration --bucket hunhar-db-backups \
     --lifecycle-configuration file://deploy/ec2/aws/s3-lifecycle.json
   ```
   (or in the console: bucket → Management → Lifecycle rule, prefix `mysql-backups/`, expire after 8 days).

## 2. IAM role for the server (no access keys on the server)

1. **IAM → Policies → Create policy → JSON**: paste `aws/backup-iam-policy.json`, replace
   `YOUR-BACKUP-BUCKET` with your bucket name. Name it `hunhar-db-backup`.
2. **IAM → Roles → Create role → AWS service → EC2**, attach `hunhar-db-backup`. Name it `hunhar-ec2`.
3. If you later use S3 for uploaded project files (`STORAGE_TYPE=s3`), add a second statement for that bucket.

## 3. Launch the EC2 instance

| Setting | Value |
|---|---|
| AMI | Ubuntu Server 24.04 LTS (22.04 also works) |
| Type | **t3.medium** (2 vCPU, 4 GB) minimum — 5 Java services + MySQL. t3.large for more traffic |
| Disk | 30 GB gp3 |
| IAM instance profile | `hunhar-ec2` |
| Security group | 22 from **your IP only**, 80 and 443 from anywhere. **Do not open 3306 or 8080-8084** |

Then **Elastic IPs → Allocate → Associate** with the instance, so the IP never changes.

## 4. DNS

The site is on Vercel today. Do steps 5–7 first (server ready, website built), **then** switch DNS so there is no downtime.

At your domain registrar / DNS provider for `hunhar.in`, set exactly these (replace the current Vercel records for
`@` and `www` — today they resolve to `216.198.79.1`; delete any `CNAME … vercel-dns.com` for `www`):

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | the Elastic IP | 300 |
| A | `www` | the Elastic IP | 300 |
| A | `api` | the Elastic IP | 300 |

If the domain's nameservers are Vercel's (`ns1.vercel-dns.com`), change these records in Vercel → Domains, or
move the nameservers to your registrar / Route 53 first.

Check from your laptop — all three must show the Elastic IP before step 8:
```bash
nslookup hunhar.in
nslookup www.hunhar.in
nslookup api.hunhar.in
```
After the switch works, remove the domain from the Vercel project (Settings → Domains) so Vercel stops answering for it.

## 5. Put the code on the server

```bash
ssh -i hunhar.pem ubuntu@<elastic-ip>
sudo mkdir -p /opt/hunhar && sudo chown ubuntu /opt/hunhar
git clone https://github.com/WCVFW/Hunhar.git /opt/hunhar/src
```
For a private repo, add a read-only **deploy key** (GitHub → repo → Settings → Deploy keys) and clone with the `git@github.com:` URL.

## 6. Set up the server (one time)

```bash
cd /opt/hunhar/src
sudo bash deploy/ec2/setup-server.sh --bucket hunhar-db-backups --region ap-south-1
```

It creates MySQL users with random passwords, writes `/opt/hunhar/.env` with random `JWT_SECRET`,
`INTERNAL_API_KEY` and admin password, and enables the services and the 02:00 backup timer.

Now fill in the real keys:

```bash
sudo nano /opt/hunhar/.env
```
- `MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD/MAIL_FROM` — signup and password-reset emails
- `GOOGLE_CLIENT_ID` — and in Google Cloud Console add `https://www.hunhar.in` and `https://hunhar.in`
  under **Authorized JavaScript origins**
- `RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET/RAZORPAY_WEBHOOK_SECRET` — live keys (`PAYMENTS_ALLOW_MOCK=false` is already set)
- `ADMIN_EMAIL` — admin login; password: `sudo cat /etc/hunhar/admin.pass`
- `FAST2SMS_API_KEY` — mobile OTP

## 7. Build and start (backend + website)

```bash
sudo hunhar-deploy
```
It builds the backend, installs the jars into `/opt/hunhar/app`, restarts all 5 services and waits until each is UP,
then builds the React website (`npm ci && npm run build`) and publishes it to `/var/www/hunhar`.
The website build reads `Hunhar-frontend/.env.production`, so it calls `https://api.hunhar.in`.

Before DNS is switched you can already check it from your laptop with the Elastic IP:
```bash
curl -H "Host: www.hunhar.in" http://<elastic-ip>/            # the website's index.html
curl -H "Host: api.hunhar.in" http://<elastic-ip>/actuator/health
```
Now do step 4 (DNS).

## 8. HTTPS (after DNS points here)

```bash
sudo certbot --nginx -d hunhar.in -d www.hunhar.in -d api.hunhar.in --redirect -m you@example.com --agree-tos
```
One certificate covers all three names; renewal is automatic (`systemctl list-timers | grep certbot`). Then check:
```bash
curl -I https://hunhar.in                       # 301 -> https://www.hunhar.in/
curl -I https://www.hunhar.in                   # 200
curl https://api.hunhar.in/actuator/health      # {"status":"UP",...}
```

In **Razorpay Dashboard → Webhooks**, set the URL to `https://api.hunhar.in/api/v1/webhooks/razorpay`.

## 9. Updating the site later

```bash
sudo hunhar-deploy                  # everything
sudo hunhar-deploy --frontend-only  # only website changes (~1 minute, no backend restart)
sudo hunhar-deploy --backend-only   # only backend changes
```
The new website is swapped in only after a successful build, so a failed build never breaks the live site.

---

## Daily database backup

- **When:** every night at **02:00 IST** (`systemd/hunhar-db-backup.timer`). If the server was off, it runs at the next boot.
- **What:** all `theunoia_*` databases into one `hunhar-db-YYYY-MM-DD_HHMM.sql.gz`, uploaded to
  `s3://<bucket>/mysql-backups/` with server-side encryption.
- **Kept:** the last **7 days** in S3; anything older is deleted by the script (and by the 8-day lifecycle rule as a backstop).
  The last 2 days are also kept on the server in `/opt/hunhar/backups`.

```bash
sudo systemctl start hunhar-db-backup           # run one now
journalctl -u hunhar-db-backup -n 50 --no-pager # its log
systemctl list-timers hunhar-db-backup.timer    # next run
sudo hunhar-db-restore --list                   # backups in S3
sudo hunhar-db-restore hunhar-db-2026-11-04_0200.sql.gz   # restore one (asks to type RESTORE)
```
Change the time in `/etc/systemd/system/hunhar-db-backup.timer` (`OnCalendar=*-*-* 02:00:00 Asia/Kolkata`;
for 2 PM use `14:00:00`), then `sudo systemctl daemon-reload`. Change the retention with `RETENTION_DAYS` in `/etc/hunhar/backup.env`.

## Everyday commands

```bash
sudo hunhar-deploy                          # deploy the latest main
systemctl status 'hunhar@*'                 # all services
journalctl -u hunhar@billing-service -f     # follow one service's log
sudo systemctl restart hunhar.target        # restart everything
sudo mysql                                  # MySQL shell as root
```

## Security checklist

- Ports 3306 and 8080-8084 are closed in the security group, and MySQL only listens on 127.0.0.1.
- `/opt/hunhar/.env` and `/etc/hunhar/*` are readable only by their owner. Never commit them.
- nginx returns 404 for `/actuator/*` except `/actuator/health`.
- The S3 bucket is private, and the instance role can only touch `mysql-backups/`.
