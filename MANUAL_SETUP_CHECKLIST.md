# WealthSpot — Manual Setup Checklist

> **Every manual action you must perform** to get WealthSpot running locally from a fresh clone.
> Automated steps (npm install, pip install) are included for completeness, but the focus
> is on things that **require human decisions, credentials, or configuration**.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Phase 1 — Prerequisites (Install Once)](#phase-1--prerequisites-install-once)
- [Phase 2 — Infrastructure (PostgreSQL + Redis)](#phase-2--infrastructure-postgresql--redis)
- [Phase 3 — Backend API Setup](#phase-3--backend-api-setup)
- [Phase 4 — Database Initialization](#phase-4--database-initialization)
- [Phase 5 — Web App Setup](#phase-5--web-app-setup)
- [Phase 6 — Shared Types Package](#phase-6--shared-types-package)
- [Phase 7 — Third-Party Services (Manual Signup Required)](#phase-7--third-party-services-manual-signup-required)
- [Phase 8 — Mobile App Setup (Optional)](#phase-8--mobile-app-setup-optional)
- [Phase 9 — Verify Everything Works](#phase-9--verify-everything-works)
- [Known Issues & Workarounds](#known-issues--workarounds)
- [Current Project State — What Works & What Doesn't](#current-project-state--what-works--what-doesnt)
- [Quick Reference — All Commands](#quick-reference--all-commands)

---

## Overview & Architecture

```
┌─────────────┐     ┌────────────────┐     ┌────────────┐
│  Web App    │────▶│  FastAPI (API)  │────▶│ PostgreSQL │
│  :5173      │     │  :8000          │     │ :5432      │
└─────────────┘     └───────┬────────┘     └────────────┘
                            │
┌─────────────┐     ┌───────▼────────┐
│  Mobile App │────▶│  Redis         │
│  (Expo)     │     │  :6379         │
└─────────────┘     └────────────────┘
```

| Component | Technology | Port |
|-----------|-----------|------|
| Web SPA | React 19 + Vite 5 + TypeScript | 5173 |
| API | FastAPI + SQLAlchemy 2 (async) | 8000 |
| Database | PostgreSQL 16 | 5432 |
| Cache/Queue | Redis 7 | 6379 |
| Mobile | Expo 51 + React Native 0.74 | — |
| Auth | Clerk (optional) + JWT (built-in) | — |
| Payments | Razorpay (optional for dev) | — |
| Storage | AWS S3 (optional for dev) | — |

---

## Phase 1 — Prerequisites (Install Once)

### ✅ Checklist

| # | Action | How to Verify | Status |
|---|--------|--------------|--------|
| 1.1 | Install **Node.js 20 LTS+** | `node --version` → `v20.x.x` or higher | ☐ |
| 1.2 | Install **Python 3.11+** (3.12 recommended) | `python --version` → `3.11.x+` | ☐ |
| 1.3 | Install **Docker Desktop** and start it | `docker --version` → `24.x+` | ☐ |
| 1.4 | Install **Git** | `git --version` | ☐ |

### Optional Tools

| Tool | Purpose | Required? |
|------|---------|-----------|
| pgAdmin / DBeaver | Visual database management | No |
| Postman / Insomnia | API testing beyond Swagger | No |
| Expo Go (iOS/Android) | Test mobile app on phone | Only for mobile dev |
| Android Studio | Android emulator | Only for mobile dev |

---

## Phase 2 — Infrastructure (PostgreSQL + Redis)

### Option A: Docker Compose (Recommended — 1 command)

```powershell
# From project root (c:\Users\repos\WealthSpot)
docker compose up postgres redis -d
```

This creates:
- **PostgreSQL 16** → `localhost:5432` (user: `wealthspot`, password: `wealthspot_dev`, database: `wealthspot`)
- **Redis 7** → `localhost:6379`

**Verify:**
```powershell
docker compose ps
# Both should show "running" with health "healthy"
```

### Option B: Local Installation (No Docker)

<details>
<summary>Click to expand local install steps</summary>

**PostgreSQL:**
1. Download & install PostgreSQL 16 from https://www.postgresql.org/download/
2. During install, set superuser password (remember it!)
3. Open pgAdmin or `psql`:
   ```sql
   CREATE USER wealthspot WITH PASSWORD 'wealthspot_dev';
   CREATE DATABASE wealthspot OWNER wealthspot;
   \c wealthspot
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

**Redis:**
1. Windows: Download from https://github.com/microsoftarchive/redis/releases or use WSL
2. Start: `redis-server`
3. Verify: `redis-cli ping` → `PONG`

</details>

### ✅ Checklist

| # | Action | How to Verify | Status |
|---|--------|--------------|--------|
| 2.1 | Start PostgreSQL container | `docker compose ps` shows postgres healthy | ☐ |
| 2.2 | Start Redis container | `docker compose ps` shows redis healthy | ☐ |

---

## Phase 3 — Backend API Setup

### 3.1 Python Virtual Environment

```powershell
cd services/api

# Create venv (if not already created)
python -m venv .venv

# Activate (PowerShell)
.venv\Scripts\Activate.ps1
```

> **Note:** The project root already has a `.venv` — the API venv at `services/api/.venv` is separate. Use the one at `services/api/.venv`.

### 3.2 Install Dependencies

```powershell
# With venv activated, from services/api/
pip install -e ".[dev]"
```

This installs: FastAPI, SQLAlchemy (async), asyncpg, Alembic, Pydantic v2, python-jose, passlib, bcrypt, httpx, boto3, redis, celery, sentry-sdk, razorpay, and dev tools.

### 3.3 Configure Environment Variables ← 🔧 MANUAL STEP

The file `services/api/.env` already exists with development defaults. **Review and confirm these values are correct:**

```dotenv
# ─── REQUIRED for local dev (already set) ────────────────
DATABASE_URL=postgresql+asyncpg://wealthspot:wealthspot_dev@localhost:5432/wealthspot
JWT_SECRET_KEY=dev-secret-key-change-in-production
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/1
APP_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# ─── OPTIONAL (leave blank for dev — features disabled) ──
RAZORPAY_KEY_ID=           # Payment processing
RAZORPAY_KEY_SECRET=       # Payment processing
AWS_ACCESS_KEY_ID=         # KYC document uploads to S3
AWS_SECRET_ACCESS_KEY=     # KYC document uploads to S3
CLERK_WEBHOOK_SECRET=      # Clerk auth webhooks
CLERK_API_KEY=             # Clerk server-side API
SENTRY_DSN=                # Error monitoring
```

**What happens if optional keys are blank:**
| Missing Key | Effect |
|-------------|--------|
| `RAZORPAY_*` | Investment payment flow won't work (invest buttons fail) |
| `AWS_*` | KYC document upload fails (no S3) |
| `CLERK_*` | Clerk webhook verification disabled (standalone JWT auth still works) |
| `SENTRY_DSN` | No error tracking (no impact on functionality) |

### ✅ Checklist

| # | Action | How to Verify | Status |
|---|--------|--------------|--------|
| 3.1 | Create/activate Python venv | `which python` or `Get-Command python` points to `.venv` | ☐ |
| 3.2 | Install pip dependencies | `pip list \| grep fastapi` shows fastapi | ☐ |
| 3.3 | Verify `services/api/.env` exists and has correct `DATABASE_URL` | `cat services/api/.env` | ☐ |

---

## Phase 4 — Database Initialization

You have **two options**. Use **Option A** (Alembic) for the migration-managed approach, or **Option B** (raw SQL) if you want seed data immediately.

### Option A: Alembic Migrations (Recommended)

```powershell
cd services/api
# With venv activated
alembic upgrade head
```

This runs the migration in `alembic/versions/001_initial_schema.py` which creates all tables, enums, indexes, and triggers.

**To also load seed data** (demo users, properties, investments):
```powershell
# After alembic upgrade head:
docker exec -i $(docker compose ps -q postgres) psql -U wealthspot -d wealthspot < database/002_seed_data.sql
```

On **Windows PowerShell**, use:
```powershell
$pgContainer = docker compose ps -q postgres
Get-Content services/api/database/002_seed_data.sql | docker exec -i $pgContainer psql -U wealthspot -d wealthspot
```

### Option B: Raw SQL Scripts

```powershell
$pgContainer = docker compose ps -q postgres

# Create schema
Get-Content services/api/database/001_initial_schema.sql | docker exec -i $pgContainer psql -U wealthspot -d wealthspot

# Load seed data (optional but recommended for dev)
Get-Content services/api/database/002_seed_data.sql | docker exec -i $pgContainer psql -U wealthspot -d wealthspot
```

### Seed Data — What Gets Created

| Entity | Count | Details |
|--------|-------|---------|
| Users | 6 | admin, builder, 2 investors, lender, referred user |
| Builder | 1 | Rajesh Constructions |
| Properties | 4 | Mumbai, Bangalore, Chennai, Pune (various statuses) |
| Investments | 4 | With transactions |
| Community Posts | 3 | With 3 replies |
| Referrals | 1 | Between users |
| Loans | 1 | Active loan |
| **Test password** | — | All users: `Test@1234` |

### ✅ Checklist

| # | Action | How to Verify | Status |
|---|--------|--------------|--------|
| 4.1 | Run migrations OR SQL schema | Tables created successfully | ☐ |
| 4.2 | (Optional) Load seed data | `SELECT count(*) FROM users;` → 6 | ☐ |

---

## Phase 5 — Web App Setup

### 5.1 Install Node Dependencies

```powershell
# From project root (installs all workspaces)
cd c:\Users\repos\WealthSpot
npm install --legacy-peer-deps
```

> **Why `--legacy-peer-deps`?** React 19 has peer dependency conflicts with some packages that still declare React 18 as peer dep.

### 5.2 Configure Environment Variables ← 🔧 MANUAL STEP

**File:** `apps/web/.env.local` — already exists with:
```dotenv
VITE_CLERK_PUBLISHABLE_KEY=pk_test_cXVhbGl0eS1raXR0ZW4tMjEuY2xlcmsuYWNjb3VudHMuZGV2JA
```

**Additional env vars you may need** (create `apps/web/.env` or add to `.env.local`):
```dotenv
# API URL — only needed if NOT using Vite proxy (already proxied in vite.config.ts)
# VITE_API_BASE_URL=http://localhost:8000/api/v1

# Razorpay client key (for payment modal)
# VITE_RAZORPAY_KEY_ID=rzp_test_XXXXXXXX
```

**How API calls work:** The Vite dev server proxies `/api` → `http://localhost:8000`, so the web app talks to `localhost:5173/api/*` which forwards to the FastAPI server. The `API_BASE_URL` constant in `src/lib/constants.ts` falls back to `http://localhost:8000/api/v1` if `VITE_API_BASE_URL` is not set.

### 5.3 Clerk Authentication Setup ← 🔧 MANUAL STEP (if using Clerk)

The app uses Clerk for authentication. A test publishable key is already configured in `.env.local`.

**If you want to use YOUR OWN Clerk account:**
1. Go to https://dashboard.clerk.com
2. Create a new application
3. Go to **API Keys** → copy the **Publishable Key**
4. Update `apps/web/.env.local`:
   ```dotenv
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   ```

**If you want to SKIP Clerk** (use standalone JWT auth only):
- The existing test key will attempt to load Clerk but may show a Clerk error overlay if the key is invalid/expired
- The standalone JWT auth (email/password via `/api/v1/auth/login`) works independently of Clerk

### ✅ Checklist

| # | Action | How to Verify | Status |
|---|--------|--------------|--------|
| 5.1 | Install npm dependencies | `ls apps/web/node_modules/.package-lock.json` exists | ☐ |
| 5.2 | Verify `.env.local` has Clerk key | `cat apps/web/.env.local` | ☐ |
| 5.3 | (Optional) Set `VITE_RAZORPAY_KEY_ID` for payments | — | ☐ |

---

## Phase 6 — Shared Types Package

The monorepo has a shared TypeScript types package at `packages/wealthspot-types/`. Both web and mobile apps import from it.

```powershell
cd packages/wealthspot-types
npx tsc --build
```

> This compiles TypeScript to `dist/` so the apps can import `@wealthspot/types`. The npm workspaces config handles linking automatically.

### ✅ Checklist

| # | Action | How to Verify | Status |
|---|--------|--------------|--------|
| 6.1 | Build shared types | `ls packages/wealthspot-types/dist/` has `.js` and `.d.ts` files | ☐ |

---

## Phase 7 — Third-Party Services (Manual Signup Required)

> **All of these are OPTIONAL for basic local dev.** The app runs without them but certain features will be disabled.

### 7.1 Clerk (Authentication) — ⚠️ Recommended

| Step | Action | Where |
|------|--------|-------|
| 1 | Create account at https://clerk.com | Browser |
| 2 | Create a new application | Clerk Dashboard |
| 3 | Copy **Publishable Key** → `apps/web/.env.local` as `VITE_CLERK_PUBLISHABLE_KEY` | Local file |
| 4 | Copy **Secret Key** → `services/api/.env` as `CLERK_API_KEY` | Local file |
| 5 | (Optional) Set up webhook: URL = `http://localhost:8000/api/v1/webhooks/clerk`, events: `user.created`, `user.updated` | Clerk Dashboard |
| 6 | Copy Webhook Signing Secret → `services/api/.env` as `CLERK_WEBHOOK_SECRET` | Local file |

### 7.2 Razorpay (Payments) — Optional

| Step | Action | Where |
|------|--------|-------|
| 1 | Create account at https://razorpay.com | Browser |
| 2 | Go to **Settings → API Keys** → Generate **Test** keys | Razorpay Dashboard |
| 3 | Copy `Key ID` → `services/api/.env` as `RAZORPAY_KEY_ID` | Local file |
| 4 | Copy `Key ID` → `apps/web/.env.local` as `VITE_RAZORPAY_KEY_ID` | Local file |
| 5 | Copy `Key Secret` → `services/api/.env` as `RAZORPAY_KEY_SECRET` | Local file |

### 7.3 AWS S3 (KYC Documents) — Optional

| Step | Action | Where |
|------|--------|-------|
| 1 | Create AWS account or use existing | AWS Console |
| 2 | Create S3 bucket `wealthspot-documents` in `ap-south-1` | AWS S3 Console |
| 3 | Create IAM user with `s3:PutObject`, `s3:GetObject` on that bucket | AWS IAM Console |
| 4 | Copy Access Key ID → `services/api/.env` as `AWS_ACCESS_KEY_ID` | Local file |
| 5 | Copy Secret Access Key → `services/api/.env` as `AWS_SECRET_ACCESS_KEY` | Local file |
| 6 | Configure CORS on bucket (allow `localhost:5173`) | AWS S3 Console |

### 7.4 Sentry (Error Monitoring) — Optional

| Step | Action | Where |
|------|--------|-------|
| 1 | Create project at https://sentry.io | Browser |
| 2 | Choose **FastAPI** platform | Sentry Dashboard |
| 3 | Copy DSN → `services/api/.env` as `SENTRY_DSN` | Local file |

### ✅ Checklist

| # | Action | Required? | Status |
|---|--------|-----------|--------|
| 7.1 | Set up Clerk account & keys | Recommended | ☐ |
| 7.2 | Set up Razorpay test keys | Only for payment testing | ☐ |
| 7.3 | Set up AWS S3 bucket | Only for KYC upload testing | ☐ |
| 7.4 | Set up Sentry | Optional | ☐ |

---

## Phase 8 — Mobile App Setup (Optional)

> Skip this if you only need the web app.

### 8.1 Install Dependencies

```powershell
cd apps/mobile
npm install --legacy-peer-deps
```

### 8.2 Configure Environment ← 🔧 MANUAL STEP

Create `apps/mobile/.env`:
```dotenv
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8000/api/v1
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

**Find your LAN IP (Windows):**
```powershell
ipconfig | Select-String "IPv4"
# Use the 192.168.x.x or 10.x.x.x address
```

> ⚠️ **Must use LAN IP, not `localhost`** — Expo on phone/emulator can't reach `localhost` on your dev machine.

### 8.3 Start Expo

```powershell
cd apps/mobile
npx expo start
```

### ✅ Checklist

| # | Action | Status |
|---|--------|--------|
| 8.1 | Install mobile npm dependencies | ☐ |
| 8.2 | Create `apps/mobile/.env` with LAN IP | ☐ |
| 8.3 | Start Expo and scan QR with Expo Go | ☐ |

---

## Phase 9 — Verify Everything Works

### Start All Services (4 terminals)

| Terminal | Command | Expected |
|----------|---------|----------|
| 1 | `docker compose up postgres redis -d` | Containers running |
| 2 | `cd services/api && .venv\Scripts\Activate.ps1 && uvicorn app.main:app --reload --port 8000` | API at http://localhost:8000 |
| 3 | `cd apps/web && npm run dev` | Web at http://localhost:5173 |
| 4 | `cd apps/mobile && npx expo start` | (Optional) Expo DevTools |

### Verification Endpoints

| Check | URL | Expected |
|-------|-----|----------|
| API Health | http://localhost:8000/health | `{"status": "healthy"}` |
| Swagger Docs | http://localhost:8000/api/docs | Interactive API docs |
| Web App | http://localhost:5173 | Landing page loads |
| Marketplace | http://localhost:5173/marketplace | Property grid (if seeded) |

### Test Login (with seed data)

Use the Swagger UI at http://localhost:8000/api/docs to test:

**POST** `/api/v1/auth/login`:
```json
{
  "email": "investor@wealthspot.in",
  "password": "Test@1234"
}
```

Should return an access token. Other seed users:
- `admin@wealthspot.in` / `Test@1234` (Admin)
- `builder@wealthspot.in` / `Test@1234` (Builder)
- `investor2@wealthspot.in` / `Test@1234` (Investor)
- `lender@wealthspot.in` / `Test@1234` (Lender)

---

## Known Issues & Workarounds

### 1. Celery Worker — MISSING FILE ⚠️

**Issue:** `docker-compose.yml` defines a `celery-worker` service that runs `celery -A app.celery_app worker`, but **no `celery_app.py` file exists** in the codebase.

**Impact:** The Celery worker container will crash on startup. This only affects background task processing (email notifications, etc.).

**Workaround:** Don't start the Celery worker. Skip it — the core API works without it:
```powershell
# Start only postgres + redis (not the full docker compose up)
docker compose up postgres redis -d
```

### 2. Clerk Provider — No Explicit `publishableKey` Prop

**Issue:** `main.tsx` renders `<ClerkProvider afterSignOutUrl="/">` without passing `publishableKey`. The `@clerk/react` SDK auto-reads `VITE_CLERK_PUBLISHABLE_KEY` from env, but this behavior depends on the SDK version.

**Impact:** May show Clerk error overlay in browser if the key isn't detected.

**Workaround:** If Clerk shows errors, ensure `apps/web/.env.local` has the key. If you don't need Clerk auth, the standalone JWT login at `/auth/login` works independently.

### 3. Vite Chunk Config — Wrong Package Name

**Issue:** `vite.config.ts` references `@clerk/clerk-react` for manual chunking, but the actual dependency is `@clerk/react`.

**Impact:** No functional impact — Clerk code just won't be split into a separate chunk (slightly larger initial bundle).

### 4. React Version Mismatch (Web vs Mobile)

**Issue:** Web uses React 19, Mobile uses React 18.2.

**Impact:** No issue unless shared code references React-specific APIs. The `@wealthspot/types` package is pure TypeScript types — no React dependency.

### 5. `--legacy-peer-deps` Required

**Issue:** Several packages have peer deps on React 18, but web uses React 19.

**Workaround:** Always use `npm install --legacy-peer-deps` for the web app.

### 6. VS Code "64 errors" in Problems Tab

**Issue:** Ghost errors from `vscode-chat-code-block://` URIs (Copilot Chat artifacts).

**Fix:** `Ctrl+Shift+P` → "Developer: Reload Window" or restart VS Code. Verify real errors with `cd apps/web && npm run build`.

---

## Current Project State — What Works & What Doesn't

### ✅ Works Out of the Box
- PostgreSQL + Redis via Docker Compose
- FastAPI backend with all 9 routers
- Alembic database migrations
- Seed data with demo users/properties
- Web app with all 16 pages (lazy-loaded)
- Standalone JWT authentication (email/password)
- Swagger API documentation
- Vite dev server with API proxy
- Shared TypeScript types package

### ⚠️ Requires Manual Setup (Third-Party Keys)
- Clerk authentication (needs publishable key)
- Razorpay payments (needs test API keys)
- AWS S3 KYC uploads (needs bucket + credentials)
- Sentry error monitoring (needs DSN)

### ❌ Not Working / Incomplete
- Celery background worker (`celery_app.py` missing)
- Stripe integration (dependency exists but no config/code wired up)
- Full Docker Compose stack (Celery service will crash)

---

## Quick Reference — All Commands

| Action | Command |
|--------|---------|
| Start PostgreSQL + Redis | `docker compose up postgres redis -d` |
| Check containers | `docker compose ps` |
| Activate API venv | `cd services/api; .venv\Scripts\Activate.ps1` |
| Install API deps | `pip install -e ".[dev]"` |
| Run migrations | `cd services/api && alembic upgrade head` |
| Seed database | PowerShell: see Phase 4 above |
| Start API server | `cd services/api && uvicorn app.main:app --reload --port 8000` |
| Install web deps | `npm install --legacy-peer-deps` (from root) |
| Start web dev server | `cd apps/web && npm run dev` |
| Build web for prod | `cd apps/web && npm run build` |
| Build shared types | `cd packages/wealthspot-types && npx tsc --build` |
| Start mobile (Expo) | `cd apps/mobile && npx expo start` |
| Stop all containers | `docker compose down` |
| Reset database | `docker compose down -v && docker compose up postgres redis -d` |
| Generate JWT secret | `python -c "import secrets; print(secrets.token_hex(32))"` |

---

## Env Files Summary

| File | Already Exists? | Must Edit? |
|------|----------------|------------|
| `services/api/.env` | ✅ Yes | Only if adding Razorpay/AWS/Clerk/Sentry keys |
| `apps/web/.env.local` | ✅ Yes | Only if changing Clerk key or adding Razorpay key |
| `apps/mobile/.env` | ❌ No | Create if doing mobile development |

---

*Generated: March 18, 2026 — WealthSpot v0.1.0*
