# THEUNOiA: Run & Deployment Guide

## Full setup from zero (Windows): Docker + Kubernetes + Jenkins

Run these in order. Steps 1 and 2 happen once per PC.

**1. Install everything** in an **Administrator** PowerShell. This installs WSL 2, Docker Desktop, kubectl, Git, and the JDK/Maven if they're missing.
```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
E:\Hunhar\theunoia-backend\scripts\install-prerequisites.ps1
```

**2. Restart Windows**, then in Docker Desktop:
- Wait for *Engine running*.
- Settings → Resources → Memory: as high as possible.
- Settings → Kubernetes → **Enable Kubernetes** → Apply.

Then check both from a new, non-admin PowerShell:
```powershell
docker version
kubectl get nodes
```

**3. Run the application.** Choose **one** of these on an 8 GB machine. Each of them runs all 12 services.

| Goal | Command | Open |
|---|---|---|
| a) Docker Compose (simplest) | `cd E:\Hunhar\theunoia-backend` then `.\run.ps1 start`, then `.\run.ps1 demo` | http://localhost:8080 |
| b) Kubernetes (Docker Desktop) | `.\scripts\deploy-k8s.ps1 -Overlay staging`, then `kubectl -n theunoia-staging port-forward svc/api-gateway 8080:8080` | http://localhost:8080 |
| c) Jenkins CI/CD → Kubernetes | `.\scripts\setup-jenkins.ps1` | http://localhost:8180 (login printed by the script) |

Option (c) starts a pre-configured Jenkins with its plugins, admin user, kubeconfig and secrets credentials, and the `theunoia-backend` pipeline job. It then triggers build #1: tests → 12 images → deploy to `theunoia-staging` → in-cluster smoke test. After that, every commit on `main` is built automatically.

To stop each option:
```powershell
.\run.ps1 stop                         # a) Compose
.\scripts\deploy-k8s.ps1 -Delete       # b) Kubernetes
.\scripts\setup-jenkins.ps1 -Stop      # c) Jenkins
```

> **No Docker at all?** `.\run-local.ps1 start` runs the whole platform with Java only (embedded PostgreSQL, an AMQP broker, a Redis-protocol server and an SMTP catcher in one helper JVM). `.\run-local.ps1 demo` and `.\run-local.ps1 stop` work as above.

> **Memory:** 12 Spring Boot services + infrastructure need about 5–6 GB. On an 8 GB PC, close other apps and run only one of a / b / c at a time. 16 GB is recommended.

---

| # | Procedure | Command | When |
|---|---|---|---|
| A | Run all tests | `.\run.ps1 test` | any machine with JDK 17 + Maven, no Docker needed |
| B | **Run the whole application** | `.\run.ps1 start` | local development and demos (Docker Compose) |
| C | End-to-end demo of every module | `.\run.ps1 demo` | after B |
| D | Infra only + services from the IDE | `.\run.ps1 infra` | debugging a single service |
| E | Deploy to Kubernetes | `.\scripts\deploy-k8s.ps1 -Overlay staging` | staging or production cluster |
| F | CI/CD with Jenkins | `Jenkinsfile` | automatic on every push |

On Linux, macOS, or Git Bash, use `./run.sh <action>` and `./scripts/deploy-k8s.sh <overlay>` instead.

---

## 0. Prerequisites (Windows)

| Tool | Version | Needed for |
|---|---|---|
| JDK | 17 | A, D |
| Maven | 3.9+ | A, D |
| Docker Desktop | 4.x, **≥ 8 GB RAM** (Settings → Resources) | B, C, D, E |
| kubectl | 1.28+ | E (Docker Desktop: Settings → Kubernetes → Enable) |

If PowerShell refuses to run the scripts, allow local scripts once for your user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

## A. Run all tests

```powershell
cd E:\Hunhar\theunoia-backend
.\run.ps1 test
```

This builds all 14 modules and runs the integration tests against an embedded PostgreSQL (real Flyway migrations and PL/pgSQL). It takes about 15 minutes and must end with `BUILD SUCCESS`.

---

## B. Run the whole application (Docker Compose)

```powershell
cd E:\Hunhar\theunoia-backend
.\run.ps1 start
```

What it does:
1. Checks that Docker is running and creates `.env` from `.env.example` if it is missing.
2. Builds 12 images from the single `Dockerfile` (the first build takes about 10–20 minutes, later builds are cached).
3. Starts PostgreSQL 16 (which creates 11 databases with one role each), Redis, RabbitMQ, MinIO, MailHog, and the 12 services.
4. Waits until every service reports **healthy**. Flyway migrations run on first start.
5. Prints the URLs:

| What | URL | Login |
|---|---|---|
| API Gateway (all APIs) | http://localhost:8080 | JWT from `/api/v1/auth/login` |
| MailHog (all emails) | http://localhost:8025 | – |
| RabbitMQ management | http://localhost:15672 | theunoia / theunoia |
| MinIO console | http://localhost:9001 | minioadmin / minioadmin |
| PostgreSQL | localhost:5432 | postgres / postgres |
| Platform admin | – | admin@theunoia.com / Admin@12345 |

Day-to-day commands:

```powershell
.\run.ps1 status                    # state + health of every container
.\run.ps1 logs payment-service      # follow one service's logs
.\run.ps1 restart project-service   # restart one service
.\run.ps1 stop                      # stop everything, keep data
.\run.ps1 clean                     # stop and DELETE all data (fresh start)
```

The same steps work with plain Docker Compose:

```powershell
copy .env.example .env
docker compose up -d --build
docker compose ps
```

---

## C. End-to-end demo

```powershell
.\run.ps1 demo
```

`scripts/demo-flow.ps1` drives the **whole platform through the API gateway** and prints each result:

1. Gateway health, CMS home page, and categories
2. Register a client and a freelancer
3. Email verification, with the token read automatically from MailHog
4. Aadhaar verification through mock DigiLocker
5. Admin approves both accounts
6. Starter credits granted to the freelancer
7. Client posts a project, and the freelancer finds it with full-text search
8. Freelancer bids, which consumes credits
9. Client compares bids and awards the project, which creates the workspace and milestone
10. Client funds the milestone into escrow (mock payment gateway)
11. Freelancer and client chat in the project room
12. Freelancer delivers, the client approves, and the escrow is released: 30,000 − 10% commission − 18% GST = **26,460 to the wallet**
13. Project completed, and both sides leave reviews
14. Freelancer withdraws to UPI, and the admin approves the payout
15. Invoices: receipt, commission tax invoice, and payout statement
16. Community question
17. Freelancer dashboard, notifications, and leaderboard
18. Admin analytics dashboard

The run should end with `Demo completed successfully`. You can run it repeatedly, because every run uses fresh users.

---

## D. Infrastructure only, services from IntelliJ

```powershell
.\run.ps1 infra
```

Then run any `*Application` class, for example `PaymentServiceApplication` or `GatewayApplication`. The defaults in each `application.yml` point to `localhost` (Postgres 5432, RabbitMQ 5672, Redis 6379, MinIO 9000, MailHog 1025). Run the gateway too so you can call everything on :8080.

> When you run services from the IDE, the database users and passwords are `<service>_user` / `<service>_pass`, created by `docker/postgres/init-databases.sh`.

---

## E. Kubernetes deployment

### E1. Local cluster (Docker Desktop Kubernetes)

```powershell
kubectl config use-context docker-desktop
.\scripts\deploy-k8s.ps1 -Overlay staging
kubectl -n theunoia-staging port-forward svc/api-gateway 8080:8080
```

The script:
1. Builds the 12 images and tags them (local images, so no registry is needed).
2. Creates `k8s/secrets.staging.env` with **strong random secrets** if it doesn't exist. It prints the admin password. Fill in the Razorpay, WhatsApp, Google, and SMTP keys later.
3. Creates the namespace `theunoia-staging` and the `theunoia-secrets` Secret.
4. Runs `kubectl apply -k k8s/overlays/staging`, which sets up PostgreSQL, RabbitMQ, Redis, MinIO, the 12 Deployments, Services, HPAs, PDBs, Ingress, and NetworkPolicies.
5. Runs the **db-provisioner Job**, which creates the per-service databases and roles.
6. Waits for every rollout and runs `rollout undo` automatically if one fails.

Check it:

```powershell
kubectl -n theunoia-staging get pods
kubectl -n theunoia-staging logs deploy/payment-service -f
curl http://localhost:8080/actuator/health
```

### E2. Real cluster (EKS, GKE, or AKS)

```powershell
docker login registry.theunoia.com
.\scripts\deploy-k8s.ps1 -Overlay production -Registry registry.theunoia.com/theunoia -Tag 1.0.0
```

Production checklist:
- [ ] Create a managed PostgreSQL 16 (RDS Multi-AZ) and put its endpoint in `k8s/overlays/production/kustomization.yaml` (`DB_HOST`). Put the master password in the `postgres-password` secret key; the db-provisioner Job creates the service databases on it.
- [ ] Create an S3 bucket `theunoia-files` and give file-service access (IRSA, or `s3-access-key` / `s3-secret-key`).
- [ ] Install ingress-nginx and cert-manager with a `letsencrypt-prod` ClusterIssuer, and point DNS `api.theunoia.com` at the ingress.
- [ ] Fill in the third-party keys in `k8s/secrets.production.env`: Razorpay + RazorpayX, Cashfree (PG + DigiLocker), WhatsApp Cloud API, Google OAuth, and SMTP (SES/SendGrid).
- [ ] Register the provider webhooks: `https://api.theunoia.com/api/v1/webhooks/razorpay` and `.../webhooks/cashfree`.
- [ ] Create and get approval for the WhatsApp templates: `registration_approved`, `new_project_match`, `new_bid_received`, `project_awarded`, `meeting_reminder`, `deadline_reminder`, `payment_reminder`, `payment_received`, `verification_completed`, `promotional_campaign`.
- [ ] Store the secrets in a vault (External Secrets / Sealed Secrets). Never commit `k8s/secrets.*.env` (it is git-ignored).

Useful operations:

```powershell
kubectl -n theunoia get hpa                                   # autoscaling status
kubectl -n theunoia rollout undo deployment/payment-service   # manual rollback
kubectl -n theunoia scale deployment/messaging-service --replicas=4
```

---

## F. Jenkins CI/CD

1. Install the Jenkins plugins: Pipeline, Git, Credentials Binding, JUnit, Workspace Cleanup (and optionally SonarQube Scanner).
2. The build agent needs JDK 17, Maven, Docker with buildx, kubectl, kustomize, and optionally trivy.
3. Add these credentials:

| ID | Type | Content |
|---|---|---|
| `docker-registry` | Username/Password | registry login |
| `kubeconfig-staging` | Secret file | kubeconfig for staging |
| `kubeconfig-production` | Secret file | kubeconfig for production |
| `theunoia-secrets-staging` | Secret file | `secrets.staging.env` |
| `theunoia-secrets-production` | Secret file | `secrets.production.env` |

4. Create a **Multibranch Pipeline** job pointing at the Git repository. Jenkins picks up the `Jenkinsfile`.
5. Each push runs: tests → quality gate → parallel image builds for the changed services → Trivy scan → deploy to staging (`main`/`develop`) → smoke tests. Production runs only when you build `main` with **DEPLOY_PRODUCTION = true**, after manual approval by `release-managers`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Docker Desktop is not running` | start Docker Desktop and wait until it reports *Engine running* |
| Containers restart with exit code 137 | give Docker more memory (≥ 8 GB) |
| A service stays *unhealthy* | `.\run.ps1 logs <service>`; usually the DB is still starting, so run `.\run.ps1 restart <service>` |
| Port 5432/8080 already in use | stop the local PostgreSQL or other app, or change the port mapping in `docker-compose.yml` |
| `401 UNTRUSTED_CALLER` | you called a service port directly; always go through the gateway on :8080 |
| `403` on bidding or posting | the account is not `ACTIVE` yet: verify the email, do KYC, get admin approval, then **log in again** |
| `422 INSUFFICIENT_CREDITS` | buy credits (`POST /api/v1/credits/purchase`) or have the admin allocate them |
| Demo times out at "verification email" | open MailHog (http://localhost:8025) and check notification-service logs |
| Want a completely fresh database | `.\run.ps1 clean`, then `.\run.ps1 start` |
