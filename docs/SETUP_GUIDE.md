# WealthSpot.in — Complete Setup Guide (DIY)

> Step-by-step instructions to run the entire WealthSpot platform locally.
> Covers infrastructure, backend API, web app, mobile app, and third-party integrations.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Structure](#2-repository-structure)
3. [Infrastructure Setup (Docker)](#3-infrastructure-setup-docker)
4. [Backend API Setup](#4-backend-api-setup)
5. [Database Initialization](#5-database-initialization)
6. [Web App Setup](#6-web-app-setup)
7. [Mobile App Setup (Expo)](#7-mobile-app-setup-expo)
8. [Shared Types Package](#8-shared-types-package)
9. [Third-Party Integrations](#9-third-party-integrations)
10. [Running Everything Together](#10-running-everything-together)
11. [Docker Compose (Full Stack)](#11-docker-compose-full-stack)
12. [Common Issues & Troubleshooting](#12-common-issues--troubleshooting)
13. [VS Code Notes](#13-vs-code-notes)
14. [Production Build & Deployment](#14-production-build--deployment)

---

## 1. Prerequisites

Install these before proceeding:

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | 20 LTS+ | [nodejs.org](https://nodejs.org/) or `nvm install 20` |
| **npm** | 10+ | Comes with Node.js |
| **Python** | 3.11+ (3.12 recommended) | [python.org](https://www.python.org/downloads/) |
| **Docker Desktop** | Latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

**Optional but recommended:**

| Tool | Purpose |
|------|---------|
| **Expo Go** (mobile) | Test mobile app on physical device |
| **Android Studio** | Android emulator for Expo |
| **Xcode** (macOS only) | iOS simulator for Expo |
| **pgAdmin / DBeaver** | GUI for PostgreSQL |
| **Postman / Insomnia** | API testing |

**Verify installations:**

```bash
node --version    # v20.x.x or higher
npm --version     # 10.x.x or higher
python --version  # 3.11.x or higher
docker --version  # 24.x or higher
git --version
```

---

## 2. Repository Structure

```
WealthSpot/
├── apps/
│   ├── web/                    # React 19 + Vite 5 + TypeScript (SPA)
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI (layout/, wealth/)
│   │   │   ├── hooks/          # useProperties, usePortfolio, useInvestment
│   │   │   ├── lib/            # api.ts, utils.ts, formatters.ts
│   │   │   ├── pages/          # 17 page components (lazy-loaded)
│   │   │   ├── services/bff/   # Backend-for-Frontend aggregation layer
│   │   │   └── stores/         # Zustand state (user, marketplace, investment)
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── mobile/                 # Expo 51 + React Native 0.74 + NativeWind v4
│       ├── app/                # Expo Router file-based routes
│       │   ├── (tabs)/         # Bottom tab screens (Home, Marketplace, Portfolio, Community, Profile)
│       │   ├── property/[slug].tsx
│       │   ├── invest/[id].tsx
│       │   └── kyc.tsx
│       ├── src/
│       │   ├── components/     # PropertyCard, MetricCard, StatusBadge, EmptyState
│       │   ├── hooks/          # useAuth
│       │   ├── lib/            # api.ts, formatters.ts
│       │   ├── services/bff/   # Mobile BFF layer
│       │   └── stores/         # user.store.ts
│       └── package.json
│
├── packages/
│   └── wealthspot-types/       # Shared TypeScript types (enums, models, API types)
│       └── src/
│
├── services/
│   └── api/                    # FastAPI backend
│       ├── app/
│       │   ├── core/           # config.py, database.py, security.py
│       │   ├── middleware/     # auth.py, audit.py, rate_limit.py
│       │   ├── models/         # SQLAlchemy models (user, property, investment, community, notification)
│       │   ├── routers/        # 9 API routers
│       │   ├── schemas/        # Pydantic schemas
│       │   └── services/       # Business logic (payment, s3, notification)
│       ├── alembic/            # Database migrations
│       ├── database/           # Raw SQL scripts (init + seed)
│       ├── .env.example
│       ├── Dockerfile
│       └── pyproject.toml
│
├── docker-compose.yml          # PostgreSQL + Redis + API + Celery + Web
├── package.json                # Root workspace config
└── turbo.json                  # Turborepo pipeline
```

---

## 3. Infrastructure Setup (Docker)

### Option A: Docker Compose (recommended for beginners)

Start PostgreSQL and Redis in containers:

```bash
# From project root
docker compose up postgres redis -d
```

This starts:
- **PostgreSQL 16** on `localhost:5432` (user: `wealthspot`, password: `wealthspot_dev`, db: `wealthspot`)
- **Redis 7** on `localhost:6379`

Verify they're running:

```bash
docker compose ps
```

### Option B: Local Installation (without Docker)

**PostgreSQL:**
1. Install PostgreSQL 16 from [postgresql.org](https://www.postgresql.org/download/)
2. Create the database:
   ```sql
   CREATE USER wealthspot WITH PASSWORD 'wealthspot_dev';
   CREATE DATABASE wealthspot OWNER wealthspot;
   GRANT ALL PRIVILEGES ON DATABASE wealthspot TO wealthspot;
   ```
3. Enable required extensions (run as superuser on the `wealthspot` database):
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

**Redis:**
1. Install Redis from [redis.io](https://redis.io/download)
2. Start: `redis-server`
3. Verify: `redis-cli ping` → should return `PONG`

---

## 4. Backend API Setup

### 4.1 Create Python Virtual Environment

```bash
cd services/api

# Create venv
python -m venv .venv

# Activate it
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (CMD):
.venv\Scripts\activate.bat
# macOS/Linux:
source .venv/bin/activate
```

### 4.2 Install Dependencies

```bash
# With venv activated:
pip install -e ".[dev]"
```

This installs: FastAPI, SQLAlchemy (async), asyncpg, Alembic, Pydantic, JWT, boto3, Razorpay, Celery, Sentry, and dev tools (pytest, ruff, mypy).

### 4.3 Configure Environment Variables

```bash
# Copy the example
cp .env.example .env
```

Edit `services/api/.env` and fill in **at minimum**:

```dotenv
# Required for local development
DATABASE_URL=postgresql+asyncpg://wealthspot:wealthspot_dev@localhost:5432/wealthspot
JWT_SECRET_KEY=my-super-secret-key-change-in-production
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
APP_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Optional – leave empty for local dev (features will be disabled)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=wealthspot-documents
AWS_REGION=ap-south-1
CLERK_WEBHOOK_SECRET=
CLERK_API_KEY=
SENTRY_DSN=
```

> **Important:** Generate a proper JWT secret for production:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

### 4.4 Start the API Server

```bash
# With venv activated, from services/api/
uvicorn app.main:app --reload --port 8000
```

The API is now available at:
- **Swagger docs:** http://localhost:8000/api/docs
- **ReDoc:** http://localhost:8000/api/redoc
- **Health check:** http://localhost:8000/api/v1/health

---

## 5. Database Initialization

You have **two options** for setting up the database schema:

### Option A: Alembic Migrations (recommended)

```bash
cd services/api

# With venv activated
# First, update alembic.ini with your DATABASE_URL
# Then run:
alembic upgrade head
```

> **Note:** The `alembic.ini` file has a default `sqlalchemy.url`. For async connections,
> the migration's `env.py` should read from your `.env` file's `DATABASE_URL`.
> If you get connection errors, update `alembic.ini`:
> ```ini
> sqlalchemy.url = postgresql+asyncpg://wealthspot:wealthspot_dev@localhost:5432/wealthspot
> ```

### Option B: Raw SQL Scripts

If you prefer running SQL directly:

```bash
# Connect to PostgreSQL
psql -U wealthspot -d wealthspot -h localhost

# Run the init script (creates all tables, enums, indexes, triggers)
\i database/001_initial_schema.sql

# Optionally load seed data (demo users, properties, investments)
\i database/002_seed_data.sql
```

Or with Docker:

```bash
# Init schema
docker exec -i $(docker compose ps -q postgres) \
  psql -U wealthspot -d wealthspot < services/api/database/001_initial_schema.sql

# Seed data
docker exec -i $(docker compose ps -q postgres) \
  psql -U wealthspot -d wealthspot < services/api/database/002_seed_data.sql
```

### Seed Data Overview

The seed script (`002_seed_data.sql`) creates:
- **6 users:** admin, builder, 2 investors, lender, referred user
- **1 builder** profile (SkyHigh Developers)
- **4 properties** across Mumbai, Bangalore, Chennai, Pune
- **4 investments** with transactions
- **3 community posts** with replies
- **1 referral** and **1 loan**
- All passwords are hashed (`Test@1234`)

---

## 6. Web App Setup

### 6.1 Install Dependencies

```bash
# From project root (installs all workspaces)
npm install --legacy-peer-deps

# Or just the web app
cd apps/web
npm install --legacy-peer-deps
```

> **Why `--legacy-peer-deps`?** React 19 has some peer dependency conflicts with older packages.

### 6.2 Configure Environment

Create `apps/web/.env.local` (or `.env`):

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-key
VITE_RAZORPAY_KEY_ID=rzp_test_your-key
```

### 6.3 Start Dev Server

```bash
cd apps/web
npm run dev
```

Opens at **http://localhost:5173**

### 6.4 Production Build

```bash
cd apps/web
npm run build
```

Output goes to `apps/web/dist/`. Serve with any static file server:
```bash
npx serve dist
```

---

## 7. Mobile App Setup (Expo)

### 7.1 Install Dependencies

```bash
cd apps/mobile
npm install --legacy-peer-deps
```

### 7.2 Configure Environment

Create `apps/mobile/.env`:

```dotenv
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000/api/v1
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-clerk-key
```

> **Important:** Use your machine's LAN IP (e.g., `192.168.1.x`), not `localhost`,
> since the mobile device/emulator needs to reach the API on your machine.
>
> Find your IP:
> - **Windows:** `ipconfig` → look for IPv4 under Wi-Fi or Ethernet
> - **macOS/Linux:** `ifconfig | grep inet`

### 7.3 Start Expo Dev Server

```bash
cd apps/mobile
npx expo start
```

This opens Expo DevTools. You can:
- **Press `a`** → Open in Android emulator
- **Press `i`** → Open in iOS simulator (macOS only)
- **Scan QR code** with Expo Go app on your phone

### 7.4 Expo Go Limitations

Expo Go doesn't support all native modules. For full functionality:
```bash
npx expo run:android   # Build native Android
npx expo run:ios       # Build native iOS (macOS only)
```

---

## 8. Shared Types Package

The `packages/wealthspot-types` package contains shared TypeScript types used by both web and mobile apps.

### Build the Types Package

```bash
cd packages/wealthspot-types
npx tsc --build
```

### Use in Apps

```typescript
import { UserRole, KycStatus, PropertyStatus } from '@wealthspot/types'
import type { User, Property, Investment, ApiResponse } from '@wealthspot/types'
```

> This works automatically via npm workspaces — no `npm link` required.

---

## 9. Third-Party Integrations

### 9.1 Razorpay (Payments)

1. Sign up at [razorpay.com](https://razorpay.com)
2. Go to **Settings → API Keys** → Generate Test Keys
3. Add to `services/api/.env`:
   ```dotenv
   RAZORPAY_KEY_ID=rzp_test_XXXXXXXX
   RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX
   ```
4. Add to `apps/web/.env.local`:
   ```dotenv
   VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXX
   ```
5. **Webhook setup** (for payment confirmation):
   - Dashboard → Webhooks → Add New
   - URL: `https://your-domain.com/api/v1/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`

### 9.2 AWS S3 (KYC Document Uploads)

1. Create an S3 bucket (e.g., `wealthspot-documents`) in `ap-south-1`
2. Create an IAM user with S3 access:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
       "Resource": "arn:aws:s3:::wealthspot-documents/*"
     }]
   }
   ```
3. Configure CORS on the bucket:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedOrigins": ["http://localhost:5173", "https://wealthspot.in"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. Add credentials to `services/api/.env`:
   ```dotenv
   AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
   AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   AWS_S3_BUCKET=wealthspot-documents
   AWS_REGION=ap-south-1
   ```

### 9.3 Clerk (Authentication — Optional)

If using Clerk for social login / webhook-based auth:

1. Create a Clerk app at [clerk.com](https://clerk.com)
2. Get API keys from **Dashboard → API Keys**
3. Add to `.env`:
   ```dotenv
   CLERK_API_KEY=sk_test_XXXXXXXX
   CLERK_WEBHOOK_SECRET=whsec_XXXXXXXX
   ```
4. Configure webhook endpoint in Clerk dashboard:
   - URL: `https://your-domain.com/api/v1/webhooks/clerk`
   - Events: `user.created`, `user.updated`

> **Note:** The platform also supports standalone JWT auth (email/password) without Clerk.

### 9.4 Sentry (Error Monitoring — Optional)

1. Create a project at [sentry.io](https://sentry.io)
2. Add DSN to `services/api/.env`:
   ```dotenv
   SENTRY_DSN=https://xxxxx@o12345.ingest.sentry.io/67890
   ```

---

## 10. Running Everything Together

Open **4 terminal windows/tabs:**

### Terminal 1 — Infrastructure
```bash
docker compose up postgres redis -d
```

### Terminal 2 — Backend API
```bash
cd services/api
.venv\Scripts\Activate.ps1   # Windows
# source .venv/bin/activate   # macOS/Linux
uvicorn app.main:app --reload --port 8000
```

### Terminal 3 — Web App
```bash
cd apps/web
npm run dev
```

### Terminal 4 — Mobile App
```bash
cd apps/mobile
npx expo start
```

### Access Points

| Service | URL |
|---------|-----|
| Web App | http://localhost:5173 |
| API Docs (Swagger) | http://localhost:8000/api/docs |
| API Docs (ReDoc) | http://localhost:8000/api/redoc |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| Expo DevTools | Shown in terminal (press `w` for web) |

---

## 11. Docker Compose (Full Stack)

To run everything via Docker (no local installations needed except Docker):

```bash
# Build and start all services
docker compose up --build

# Or in background
docker compose up --build -d

# Check logs
docker compose logs -f api
docker compose logs -f web
```

This starts: PostgreSQL, Redis, FastAPI (with hot-reload), Celery worker, and Vite dev server.

> **Note:** You still need to create `services/api/.env` before running Docker Compose.

---

## 12. Common Issues & Troubleshooting

### "Module not found" in web app
```bash
cd apps/web
rm -rf node_modules
npm install --legacy-peer-deps
```

### TypeScript type conflicts (`@types/react`)
The monorepo uses React 19 for web and React Native 0.74 (React 18) for mobile. The root `package.json` has `@types/react@^18` for React Native compatibility. The web app has `@types/react@^19` in its own `node_modules`. This is intentional — don't hoist `@types/react` to root.

### Python "ModuleNotFoundError"
```bash
cd services/api
.venv\Scripts\Activate.ps1   # Make sure venv is activated
pip install -e ".[dev]"
```

### Database connection refused
- Ensure PostgreSQL is running: `docker compose ps` or `pg_isready -h localhost`
- Check `DATABASE_URL` in `services/api/.env`
- If using Docker, wait for the healthcheck to pass

### Alembic migration errors
If you get "target database is not up to date":
```bash
cd services/api
alembic stamp head   # Reset to current
alembic upgrade head
```

If you want to start fresh:
```bash
# Drop and recreate database
docker exec -i $(docker compose ps -q postgres) \
  psql -U wealthspot -c "DROP DATABASE wealthspot; CREATE DATABASE wealthspot OWNER wealthspot;"
alembic upgrade head
```

### Mobile can't reach API
- Use LAN IP, not `localhost` in `EXPO_PUBLIC_API_URL`
- Ensure phone/emulator is on the same Wi-Fi network
- Check firewall isn't blocking port 8000
- Windows: `New-NetFirewallRule -DisplayName "WealthSpot API" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow`

### "64 errors / 23 warnings" in VS Code Problems tab
These are **NOT real project errors**. They come from `vscode-chat-code-block://` URIs — artifacts from old Copilot Chat code snippets cached in the editor. Your actual source files compile cleanly.

**To clear them:**
1. Close all Copilot Chat panels/tabs
2. Run `Developer: Reload Window` (Ctrl+Shift+P → "Reload Window")
3. Or restart VS Code entirely

**To verify zero real errors:**
```bash
# Web build should succeed with 0 errors
cd apps/web && npm run build

# Python type check
cd services/api && mypy app/ --ignore-missing-imports
```

### NativeWind styles not applying on mobile
Ensure `nativewind-env.d.ts` exists in `apps/mobile/` with:
```typescript
/// <reference types="nativewind/types" />
```
And `tailwind.config.js` has the correct content paths.

### Port already in use
```bash
# Find what's using the port (Windows)
netstat -ano | findstr :8000

# Kill it
taskkill /PID <PID> /F
```

---

## 13. VS Code Notes

### Recommended Extensions

- **Python** (ms-python.python)
- **Pylance** (ms-python.vscode-pylance)
- **ESLint** (dbaeumer.vscode-eslint)
- **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
- **Prettier** (esbenp.prettier-vscode)
- **Docker** (ms-azuretools.vscode-docker)
- **PostgreSQL** (ckolkman.vscode-postgres)

### Workspace Settings

The monorepo works best if you open the **WealthSpot** root folder in VS Code (not individual sub-folders).

For Python IntelliSense, set the interpreter to `services/api/.venv/Scripts/python.exe` (Windows) or `services/api/.venv/bin/python` (macOS/Linux):
- Ctrl+Shift+P → "Python: Select Interpreter" → choose the `.venv` one

---

## 14. Production Build & Deployment

### Web App (Static SPA)

```bash
cd apps/web
npm run build
# Output: apps/web/dist/
```

Deploy `dist/` to any static hosting:
- **Vercel:** `npx vercel --prod`
- **Netlify:** Drag-and-drop `dist/` or connect Git
- **AWS S3 + CloudFront**
- **Azure Static Web Apps**

### Backend API

```bash
# Build Docker image
docker build -t wealthspot-api ./services/api

# Run
docker run -p 8000:8000 --env-file services/api/.env wealthspot-api
```

Deploy to:
- **AWS ECS / Fargate**
- **Azure Container Apps**
- **Google Cloud Run**
- **Railway / Render**

### Mobile App

```bash
cd apps/mobile

# Build for Android (APK)
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

Requires an [Expo Application Services (EAS)](https://expo.dev/eas) account.

### Database

Use a managed PostgreSQL service in production:
- **AWS RDS** (PostgreSQL 16)
- **Azure Database for PostgreSQL**
- **Supabase**
- **Neon**

Update `DATABASE_URL` to point to your production instance.

---

## Quick Reference — All Commands

| Action | Command |
|--------|---------|
| Start infra (Docker) | `docker compose up postgres redis -d` |
| Start API | `cd services/api && uvicorn app.main:app --reload` |
| Start web | `cd apps/web && npm run dev` |
| Start mobile | `cd apps/mobile && npx expo start` |
| Run migrations | `cd services/api && alembic upgrade head` |
| Seed database | `psql -U wealthspot -d wealthspot -f database/002_seed_data.sql` |
| Build web | `cd apps/web && npm run build` |
| Build types | `cd packages/wealthspot-types && npx tsc --build` |
| Run all (Docker) | `docker compose up --build` |
| Stop all (Docker) | `docker compose down` |
| Reset database | `docker compose down -v && docker compose up postgres redis -d` |

---

*Last updated: $(date). Generated for WealthSpot.in v0.1.0*


# Backend tests + coverage
cd services/api && pytest --cov=app

# Web tests + coverage
cd apps/web && npx vitest run --coverage

# Web BFF functional tests
cd apps/web && npm run test:functional

# Mobile tests
cd apps/mobile && npx vitest run

# E2E (install browsers first)
cd apps/web && npx playwright install chromium && npm run test:e2e

# Performance
cd services/api && locust -f tests/performance/locustfile.py --host http://localhost:8000