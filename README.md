# Hunhar (THEUNOiA) — Full-Stack Marketplace Platform

[![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203.3.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring Cloud](https://img.shields.io/badge/Gateway-Spring%20Cloud%202023-blue.svg)](https://spring.io/projects/spring-cloud)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20TypeScript-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8.svg)](https://tailwindcss.com/)
[![Java](https://img.shields.io/badge/JDK-17-orange.svg)](https://www.oracle.com/java/)
[![Security](https://img.shields.io/badge/Security-AES--256--GCM%20%7C%20JWT-red.svg)](#security--data-encryption)

Hunhar (formerly THEUNOiA) is an enterprise-grade freelancing, gig-bidding, and team collaboration platform. It connects clients with verified freelancers through structured milestone bidding, escrow payments, real-time collaboration, and automated GST/commission handling.

---

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
- [Security & Data Encryption](#-security--data-encryption)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
- [Services & Port Mapping](#-services--port-mapping)
- [Role-Based Access & URL Routes](#-role-based-access--url-routes)
- [Production Deployment](#-production-deployment)
- [License](#-license)

---

## 🏛 Architecture Overview

Hunhar is powered by 4 domain-driven microservices + 1 API Gateway + 1 Shared Library:

```
                      [ Client / Browser ]
                               │
                               ▼
               [ Spring Cloud Gateway :8080 ]
                               │
    ┌───────────────┬──────────┴──────────┬────────────────┐
    ▼               ▼                     ▼                ▼
[ Identity ]   [ Project ]           [ Billing ]     [ Engagement ]
  (:8081)        (:8082)               (:8083)          (:8084)
  Auth, KYC,     Discovery, Bids,     Escrow, Wallet,   STOMP Chat,
  Profiles,      Workspaces, Team     Credits, GST,     WhatsApp, CMS,
  Leaderboard    Collaboration        Invoices, Razorpay Notifications
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Routing**: React Router v6 (Protected Role Routes)
- **Styling**: Tailwind CSS, Manrope typography, Lucide React icons
- **State & Storage**: Secure Token Storage (`localStorage`), custom event dispatching

### Backend
- **Core**: Java 17, Spring Boot 3.3.5, Spring Cloud 2023
- **Security**: Spring Security 6, JWT (HMAC-SHA256), AES-256-GCM data encryption
- **Database & ORM**: Spring Data JPA, Hibernate, MySQL 8 / PostgreSQL
- **Real-Time**: Spring WebSocket (STOMP Protocol)
- **Billing & PDF**: Razorpay, Cashfree Webhooks, OpenPDF Invoice Generator

---

## 🚀 Key Features

### 1. Freelancer Module
- **Intuitive Dashboard**: Active project stats, live earnings, to-do task integration, and bid status tracker.
- **Project Discovery**: Category filters, budget ranges, and keyword searches.
- **Bidding System**: Credit-based bids with dynamic cost proposals and delivery milestones.
- **Team Collaboration**: Search freelancers, send invites, and collaborate inside dedicated project workspaces.
- **Leaderboard**: Algorithm-based scoring:
  $$\text{Score} = (\text{Projects} \times 20) + (\text{Rating} \times 25) + \left(\frac{\text{Revenue}}{1000}\right) + (\text{SuccessRate} \times 0.5)$$

### 2. Client Module
- **Project Lifecycle**: Project posting, milestone creation, and status transitions (`OPEN` $\to$ `ACTIVE` $\to$ `COMPLETED`).
- **Bid Management**: Review, compare, shortlist, and award bids.
- **Escrow Funding**: Milestone funding with automatic 10% platform commission & 18% GST deduction.

### 3. Billing & Wallet
- Multi-currency / INR transactions with formatted invoice generation.
- Wallet balance management (available balance, escrow holds, withdrawals).
- Starter credits (10 credits on registration) and credit top-up packages.

### 4. Real-time Communication
- 1-to-1 and group team workspace chat over WebSockets (`/ws`).
- Notification system with unread counts and direct deep-linking.

---

## 🔐 Security & Data Encryption

1. **Authenticated Data Encryption (AES-256-GCM)**:
   - Sensitive PII (Aadhaar, PAN card, Bank details) are encrypted at rest using AES-256 with 128-bit authentication tags and random IV vectors (`EncryptionUtils.java`).
2. **Data Masking**:
   - PII such as Aadhaar is masked dynamically (`XXXXXXXX` + last 4 digits) for display.
3. **Stateless JWT Security**:
   - Signed JWTs with expiry and role verification (`FREELANCER`, `CLIENT`, `ADMIN`).
4. **CORS & Gateway Rate Limiting**:
   - Centralized CORS and authenticated header propagation via API Gateway.

---

## 📂 Project Structure

```
Hunhar/
├── .gitignore                      # Comprehensive Git exclusion rules
├── README.md                       # Main platform documentation
├── Hunhar-backend/                 # Spring Boot microservices
│   ├── api-gateway/                # Port 8080 - Spring Cloud Gateway
│   ├── identity-service/           # Port 8081 - Auth, KYC, Profiles
│   ├── project-service/            # Port 8082 - Projects, Bids, Workspace
│   ├── billing-service/            # Port 8083 - Wallet, Escrow, Credits
│   ├── engagement-service/         # Port 8084 - Chat, Forum, CMS
│   ├── common-lib/                 # Shared DTOs, Security & Encryption
│   ├── start-all.bat               # Windows launcher for all backend services
│   └── stop-all.bat                # Windows stop script
└── Hunhar-frontend/                # React + TypeScript + Vite SPA
    ├── src/
    │   ├── components/             # Reusable UI & Layouts (Sidebar, Navbars)
    │   ├── pages/                  # Freelancer, Client, Admin & Auth pages
    │   └── services/               # API clients, formatters, token storage
    ├── index.html
    └── package.json
```

---

## 🛠 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **JDK**: Java 17 (Eclipse Temurin or Oracle JDK)
- **Maven**: 3.8+ (or use included `mvnw`)
- **MySQL**: 8.0+

### Environment Configuration

1. **Backend Configuration** (`Hunhar-backend/.env` or system environment):
   ```env
   HUNHAR_DATA_ENCRYPTION_KEY=YourSuperSecretKeyWith32CharsLong!
   JWT_SECRET=your_jwt_signing_secret_here_at_least_256_bits
   SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/hunhar_db?useSSL=false&allowPublicKeyRetrieval=true
   SPRING_DATASOURCE_USERNAME=root
   SPRING_DATASOURCE_PASSWORD=root
   ```

2. **Frontend Configuration** (`Hunhar-frontend/.env`):
   ```env
   VITE_API_BASE_URL=http://localhost:8080
   ```

---

### Running the Backend

#### Option A: One-Click Startup (Windows)
```cmd
cd Hunhar-backend
start-all.bat
```

#### Option B: Individual Maven Startup
```bash
# In separate terminal windows:
cd Hunhar-backend/api-gateway && mvn spring-boot:run
cd Hunhar-backend/identity-service && mvn spring-boot:run
cd Hunhar-backend/project-service && mvn spring-boot:run
cd Hunhar-backend/billing-service && mvn spring-boot:run
cd Hunhar-backend/engagement-service && mvn spring-boot:run
```

To stop all background services on Windows:
```cmd
cd Hunhar-backend
stop-all.bat
```

---

### Running the Frontend

```bash
cd Hunhar-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🌐 Services & Port Mapping

| Service | Port | Base Path | Responsibilities |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `8080` | `/api/v1/**` | Reverse proxy, CORS, JWT routing |
| **Identity Service** | `8081` | `/api/v1/auth`, `/api/v1/users`, `/api/v1/kyc` | Auth, Profiles, Aadhaar KYC, Leaderboard |
| **Project Service** | `8082` | `/api/v1/projects`, `/api/v1/bids`, `/api/v1/workspaces` | Project discovery, Bidding, Teams |
| **Billing Service** | `8083` | `/api/v1/wallet`, `/api/v1/credits`, `/api/v1/escrow` | Payments, Razorpay, Escrow, Invoices |
| **Engagement Service**| `8084` | `/api/v1/messages`, `/api/v1/forum`, `/ws` | WebSocket Live Chat, Notifications, CMS |
| **Frontend (Vite)** | `5173` | `/` | Responsive SPA User Interface |

---

## 🧭 Role-Based Access & URL Routes

### 👤 Freelancer (`/freelancer/*`)
- `/freelancer/dashboard` — Overview, stats, and to-do list
- `/freelancer/browse` — Explore projects with filter options
- `/freelancer/browse/:projectId` — Project description and requirements
- `/freelancer/browse/:projectId/bid` — Submit proposal & milestones
- `/freelancer/projects` — Active projects and submissions
- `/freelancer/projects/:projectId` — Workspace overview & deliverables
- `/freelancer/team` — Team collaboration and invite freelancer modal
- `/freelancer/messages` — Messaging and real-time chat
- `/freelancer/calendar` — Planner tasks and deadline manager
- `/freelancer/credits` — Buy and track bid credit balances
- `/freelancer/wallet` — Earnings, withdrawal requests, and payouts
- `/freelancer/leaderboard` — Community rankings

### 🏢 Client (`/client/*`)
- `/client/dashboard` — Project management & activity overview
- `/client/create-project` — Create and publish projects
- `/client/projects` — Project bid review, shortlisting & award
- `/client/messages` — Client workspace chat
- `/client/payments` — Escrow releases and payments

### 🛡 Admin (`/admin/*`)
- `/admin/dashboard` — Platform performance & analytics
- `/admin/users` — User approvals, role verification, and KYC
- `/admin/transactions` — Platform transactions & fee tracking
- `/admin/disputes` — Dispute resolution portal

---

## ☁ Production Deployment

- **Docker & Compose**: Use `docker-compose.yml` to spin up MySQL, Redis, and all microservices.
- **CI/CD**: Configured with `Jenkinsfile` for automated build, test, Docker image push, and AWS ECS rollout.
- **AWS Architecture**: See [AWS Deployment Guide](file:///e:/Hunhar/Hunhar-backend/AWS_DEPLOYMENT_GUIDE.md) for Amazon ECS, ECR, RDS, and Route53 configuration.

---

## 📄 License

This project is proprietary software developed for **Hunhar / THEUNOiA**. All rights reserved.