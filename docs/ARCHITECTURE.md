# WealthSpot Architecture

## Overview

WealthSpot is a fractional real-estate investment platform. It is composed of:

- **Backend API** — FastAPI (Python), SQLAlchemy async, PostgreSQL, Redis, Celery
- **Web App** — React + Vite (TypeScript), Tailwind CSS, React Query, Zustand, Clerk Auth
- **Mobile App** — Expo / React Native (TypeScript), NativeWind

---

## 1. Core Principles

### 1.1 Database-First — Live Data Everywhere

All data visible to the user MUST come from the database via the API.  
The only current exception is the static **VAULTS** tile array on `VaultsPage.tsx` (content marketing copy).  
Mock/hardcoded data in components is treated as a defect and must be replaced.

### 1.2 Single Source of Truth

- User profile, KYC status, referral code, and document list are owned by the API (`GET /auth/me`).
- Frontend stores (Zustand) hold only ephemeral UI state. They do not own business data.
- `useUserProfile()` hook fetches from `/auth/me`; `SettingsPage` reads from this hook — never from a local constant.

### 1.3 Role-Based Access

All privileged operations are enforced at the API with FastAPI `Depends(require_role(...))`.  
The frontend performs _advisory_ role checks (to hide UI elements) but never _authoritative_ ones.

| Role       | Capabilities                                       |
|------------|----------------------------------------------------|
| investor   | View marketplace, invest, view own portfolio       |
| builder    | Create/manage property listings                    |
| admin      | Approve listings, soft-delete tiles                |
| approver   | Approve/reject submissions in approval queue       |
| super_admin| Full system access incl. Command Control Centre    |

### 1.4 Soft Deletes

Resources are __never__ hard-deleted by the user.  
Properties use `status = ARCHIVED` (set via `DELETE /properties/{id}`).  
Archived items are automatically excluded from all public listing queries.

### 1.5 Referral Codes are User-Scoped

Each user receives a unique referral code generated at registration (`auth.py → /register`).  
The code is persisted in the `users` table and returned via `GET /auth/me`.  
Frontend never generates or hard-codes a referral code.

---

## 2. Navigation Architecture

### Vaults Page (primary dashboard)

The `VaultsPage` is the authenticated home screen.  
It provides a self-contained header with quick-access nav links mirroring the top navbar.

**Quick links:** Portfolio · Community · Settings · Approvals† · Control Centre†  
(† shown only to users with appropriate roles)

**Referrals** — moved from top nav into **Settings → Referrals tab**.

### Top Navbar (Navbar.tsx)

Shown on all non-vaults pages. Links:  
Portfolio · Community · Settings · Approvals† · Control Centre†

Marketplace is not a top-level navigation destination. It is accessed via Vault CTAs.

---

## 3. API Layer

### Base URL

```
http://localhost:8000/api/v1   (local dev)
```

Vite proxies `/api/v1` → `http://localhost:8000/api/v1` in dev.

### Key Endpoints

| Method | Path                          | Auth   | Description                            |
|--------|-------------------------------|--------|----------------------------------------|
| POST   | /auth/register                | None   | Register user, auto-generates referral code |
| POST   | /auth/login                   | None   | Login, returns JWT                     |
| GET    | /auth/me                      | JWT    | Full profile + KYC docs                |
| PUT    | /auth/me                      | JWT    | Update profile fields                  |
| GET    | /properties                   | None   | List active/funding/funded properties  |
| DELETE | /properties/{id}              | Admin  | Soft-delete (sets status=ARCHIVED)     |
| GET    | /referrals/stats              | JWT    | Referral code, link, stats             |
| GET    | /referrals/history            | JWT    | List of referred users                 |
| POST   | /referrals/apply              | JWT    | Apply a referral code at signup        |

### API Client Helpers (`apps/web/src/lib/api.ts`)

| Helper      | Description                    |
|-------------|--------------------------------|
| `apiGet`    | GET with JWT auto-attach       |
| `apiPost`   | POST with JSON body            |
| `apiPut`    | PUT with JSON body             |
| `apiDelete` | DELETE (no body)               |

---

## 4. Frontend Hooks

All server state is managed via React Query hooks in `apps/web/src/hooks/`.

| Hook                 | Endpoint              | Cache key              |
|----------------------|-----------------------|------------------------|
| `useProperties`      | GET /properties       | `['properties', ...]`  |
| `useUserProfile`     | GET /auth/me          | `['user', 'me']`       |
| `useReferralStats`   | GET /referrals/stats  | `['referrals', 'stats']` |
| `useReferralHistory` | GET /referrals/history| `['referrals', 'history']` |
| `useOpportunities`   | GET /opportunities    | `['opportunities']`    |
| `usePortfolio`       | GET /portfolio        | `['portfolio']`        |
| `useApprovals`       | GET /approvals        | `['approvals']`        |

---

## 5. State Management

| Store               | Purpose                                        |
|---------------------|------------------------------------------------|
| `useUserStore`      | Logged-in user (role, isAuthenticated)         |
| `useMarketplaceStore` | Marketplace filters, view mode, pagination   |

Zustand stores are lightweight and hold only UI/session state.  
They do NOT cache API responses — that is React Query's responsibility.

---

## 6. Authentication

- **Clerk** (`@clerk/react`) handles sign-in UI, session management, and OAuth.
- After Clerk signs in, the app calls `POST /auth/login` with the Clerk token to obtain a WealthSpot JWT (`ws_token`), stored in `localStorage`.
- `apiGet/apiPost/...` helpers automatically attach `Authorization: Bearer <ws_token>`.
- `get_current_user` FastAPI dependency decodes and validates the JWT.

---

## 7. Contribution System (Investor Pillars)

The four investor pillars each have a dedicated Contribute page:

| Pillar    | Route                   | Page                       |
|-----------|-------------------------|----------------------------|
| Wealth    | /contribute/wealth      | ContributeWealthPage.tsx   |
| Time      | /contribute/time        | ContributeTimePage.tsx     |
| Network   | /contribute/network     | ContributeNetworkPage.tsx  |
| Education | /contribute/education   | ContributeEducationPage.tsx |

These are stub pages, ready for full implementation.

---

## 8. Diagnostic System

`DiagnosticPanel.tsx` provides a developer console overlay with:
- **Category filters**: UI · API · DB · NAV · SYS
- **Level filters**: info · warn · error · debug
- **Issue type dropdown**: All · API Errors · Long Tasks · Navigation · Console Errors
- **Text search**: filters log messages in real-time
- `diagLog(category, level, message)` can be called from anywhere
- `diagApiTrace(method, url)` instruments API calls end-to-end

The panel is only rendered in development (`import.meta.env.MODE === 'development'` — see App.tsx).

---

## 9. Patterns & Practices

- **Lazy loading**: All pages are `React.lazy()` imported in `App.tsx` via `<Suspense>`.
- **Error boundaries**: `ErrorBoundary` wraps the entire route tree.
- **Tailwind**: Utility-first. No CSS modules. Custom classes in `index.css` via `@layer components`.
- **Enum as string**: SQLAlchemy enums use `native_enum=False`; new values can be added without DB migrations.
- **Alembic migrations**: All schema changes go through Alembic. Migration files live in `services/api/alembic/versions/`.
- **No hardcoded credentials**: All secrets via `.env` files (not committed to git).
