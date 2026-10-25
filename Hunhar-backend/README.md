# THEUNOiA — Spring Boot Microservices Backend

Production-ready backend for **THEUNOiA**, a freelancing and collaboration marketplace platform enabling businesses to connect with skilled freelancers through structured bidding, escrow payments, real-time messaging, and collaboration workspaces.

Built with **Java 17**, **Spring Boot 3.3.5**, **Spring Cloud 2023**, and designed specifically for **AWS deployment** (Amazon ECS, ECR, RDS MySQL, Route53, ALB) with **Jenkins CI/CD**.

---

## 1. Architecture Highlights

Instead of an over-fragmented setup of 12+ microservices that wastes memory and drives up AWS infrastructure costs, THEUNOiA Backend is built on **4 Domain-Driven Core Microservices** + **1 API Gateway** + **1 Shared Common Library**:

```
[ Frontend (React/Vite) ]
           │
           ▼
[ Spring Cloud API Gateway :8080 ] (CORS, JWT Claim Forwarding, Routing)
     ├──► [ identity-service   :8081 ] (Auth, Aadhaar KYC, Profiles, Leaderboard)
     ├──► [ project-service    :8082 ] (Discovery, Bidding, Workspaces, Teams)
     ├──► [ billing-service    :8083 ] (Credits, Wallet, Escrow, Razorpay/Cashfree, Invoices)
     └──► [ engagement-service :8084 ] (WebSocket STOMP Chat, WhatsApp API, Forum, CMS, Analytics)
```

---

## 2. Modules & Feature Coverage

Every single module from the **MVP Technical Breakdown Document** is fully implemented:

1. **Public Website (CMS & SEO)**:
   - Dynamic landing pages (`/api/v1/content/pages/{slug}`)
   - Blog categories and FAQs
   - Contact inquiry and lead submission forms (`/api/v1/content/contact`)
   - SEO metadata management

2. **Authentication System**:
   - Freelancer registration with skills & portfolio links
   - Client registration with company details
   - Secure login with BCrypt password hashing & JWT tokens
   - Refresh token support
   - Aadhaar KYC verification via DigiLocker Lite (`/api/v1/kyc/aadhaar`)
   - Admin verification & user status control

3. **Freelancer Module**:
   - Freelancer profile management
   - Project discovery with keyword search and category filters
   - Bidding system consuming credit units
   - Assigned project workspaces with deliverables and status updates
   - Ranking / Leaderboard system with score formula:
     `(CompletedProjects * 20) + (Rating * 25) + (Revenue / 1000) + (SuccessRate * 0.5)`

4. **Client Module**:
   - Project creation with budget, timeline, documents, and category
   - Project lifecycle management (`OPEN`, `ACTIVE`, `COMPLETED`, `CANCELLED`)
   - Bid review, comparison, shortlisting, and awarding
   - Milestone escrow funding and release

5. **Messaging & Notification Module**:
   - One-to-one and project-based conversation workspaces
   - Real-time WebSocket (STOMP protocol) live chat at `/ws`
   - File sharing and attachment links
   - WhatsApp Business API automation triggers for:
     - Registration Approval
     - New Project Matches
     - New Bid Received
     - Project Awarded
     - Meeting & Deadline Reminders
     - Payment Received
   - Google Calendar integration for meetings and deadlines

6. **Credit System**:
   - 10 Starter credits allocated upon freelancer registration
   - Credits consumed on each bid submission (2 credits / bid)
   - Credit packages purchase (`/api/v1/credits/packages`)
   - Admin manual credit allocation
   - Immutable credit transaction ledger

7. **Payment & Wallet System**:
   - Wallet management (available balance, escrow holds, total earned, total withdrawn)
   - Platform escrow payments with automatic **10% platform commission** and **18% GST** deduction
   - Direct payments support
   - Payment gateway integration: **Razorpay** & **Cashfree** with webhook verification
   - Payout requests (Bank Transfer, UPI, RazorpayX) with admin approval
   - Automatic PDF invoice generation using OpenPDF (`/api/v1/invoices/{id}/pdf`)

8. **Community Forum**:
   - Discussions, questions & answers, and industry topics
   - Accepted answer marking for Q&A
   - Upvoting system and moderation

9. **Admin Panel**:
   - User management (approval, suspension, KYC verification)
   - Project and dispute resolution (`/api/v1/disputes`)
   - Payout request approval workflow
   - Forum moderation

10. **Analytics & Reporting**:
    - Platform-wide metrics: total users, active users, new registrations, project counts, platform revenue, commission earnings, and growth trends

---

## 3. Quick Start (Local Development)

### Prerequisites
- Java 17+
- Maven 3.9+
- Docker & Docker Compose (optional for containerized run)

### Option A: Build and Run via Docker Compose (Recommended)
```powershell
cd E:\Hunhar\Hunhar-backend
.\run.ps1 start
```
Or with Docker Compose directly:
```bash
docker compose up -d --build
```

### Option B: Build and Run Locally with Maven
```powershell
cd E:\Hunhar\Hunhar-backend
mvn clean package -DskipTests
```
Then start each service in separate terminal windows:
```powershell
# 1. Start Gateway
java -jar api-gateway/target/api-gateway-1.0.0.jar

# 2. Start Identity Service
java -jar identity-service/target/identity-service-1.0.0.jar

# 3. Start Project Service
java -jar project-service/target/project-service-1.0.0.jar

# 4. Start Billing Service
java -jar billing-service/target/billing-service-1.0.0.jar

# 5. Start Engagement Service
java -jar engagement-service/target/engagement-service-1.0.0.jar
```

---

## 4. API Endpoints Reference

All requests pass through the **API Gateway** on `http://localhost:8080`.

| Category | Endpoint | Method | Description |
|---|---|---|---|
| **Auth** | `/api/v1/auth/register/freelancer` | POST | Register freelancer |
| **Auth** | `/api/v1/auth/register/client` | POST | Register client |
| **Auth** | `/api/v1/auth/login` | POST | Authenticate and obtain JWT |
| **Auth** | `/api/v1/auth/me` | GET | Current user profile |
| **KYC** | `/api/v1/kyc/aadhaar` | POST | Submit 12-digit Aadhaar for DigiLocker verification |
| **Projects** | `/api/v1/projects` | POST | Create project (client) |
| **Projects** | `/api/v1/projects` | GET | Search / browse projects with filters |
| **Bids** | `/api/v1/bids/project/{projectId}` | POST | Submit bid (consumes 2 credits) |
| **Bids** | `/api/v1/bids/{bidId}/award` | POST | Award project to freelancer |
| **Workspace** | `/api/v1/workspace/projects/{id}/milestones` | POST | Create milestone |
| **Workspace** | `/api/v1/workspace/milestones/{id}/deliverables` | POST | Submit deliverable |
| **Credits** | `/api/v1/credits/my-credits` | GET | View freelancer credit balance |
| **Credits** | `/api/v1/credits/packages` | GET | View credit packages |
| **Wallet** | `/api/v1/wallets/my-wallet` | GET | View wallet balance |
| **Wallet** | `/api/v1/wallets/payout` | POST | Request withdrawal (UPI/Bank) |
| **Payments** | `/api/v1/payments/escrow/release` | POST | Release milestone escrow to freelancer |
| **Invoices** | `/api/v1/invoices/{number}/pdf` | GET | Download PDF invoice |
| **Messages** | `/api/v1/messages/conversations` | GET/POST | 1-to-1 & project chat conversations |
| **WebSocket** | `/ws` | WS | STOMP live chat connection |
| **Community** | `/api/v1/community/posts` | GET/POST | Discussion forum posts & Q&A |
| **Analytics** | `/api/v1/analytics/summary` | GET | Platform admin metrics |

---

## 5. AWS & Jenkins CI/CD

- **Jenkinsfile**: See [`Jenkinsfile`](file:///e:/Hunhar/Hunhar-backend/Jenkinsfile) for the declarative pipeline to build, test, package, push to Amazon ECR, and deploy to Amazon ECS Fargate.
- **AWS Guide**: See [`AWS_DEPLOYMENT_GUIDE.md`](file:///e:/Hunhar/Hunhar-backend/AWS_DEPLOYMENT_GUIDE.md) for full VPC, ALB, ECS, and RDS MySQL configuration details.
