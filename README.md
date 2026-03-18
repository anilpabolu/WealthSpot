# WealthSpot.in

> Fractional Real Estate Investment Platform for India  
> SEBI-compliant · RERA-verified · Built with love in Bengaluru

---

## Architecture

```
WealthSpot/
├── apps/
│   ├── web/          # React 19 + Vite 5 + TypeScript (SPA)
│   └── mobile/       # Expo 51 + React Native 0.74 + NativeWind v4
├── services/
│   └── api/          # FastAPI 0.115 + SQLAlchemy 2 + asyncpg
└── docker-compose.yml
```

## Tech Stack

| Layer      | Technology |
|------------|-----------|
| Web        | React 19, Vite 5, TypeScript 5 (strict), Tailwind CSS 3, Zustand 4, TanStack Query 5, React Router v6, Zod, react-hook-form |
| Mobile     | Expo SDK 51, React Native 0.74, Expo Router 3.5, NativeWind v4, Zustand, TanStack Query |
| Backend    | FastAPI, Pydantic v2, SQLAlchemy 2 (async), asyncpg, Alembic, python-jose (JWT) |
| Payments   | Razorpay (UPI, cards, net-banking) |
| Storage    | AWS S3 (KYC documents) |
| Database   | PostgreSQL 16 |
| Queue      | Redis + Celery |
| Monitoring | Sentry |

## Design System

- **Primary:** `#5B4FCF` (Deep Purple)
- **Fonts:** Syne (display), DM Sans (body), DM Mono (numbers)
- **Mode:** Light-only
- **Currency:** INR with Indian comma formatting (₹12,34,567)
- **Components:** Card-based, rounded-2xl, subtle shadows, shimmer skeletons

## Web Screens (15 pages)

1. **Landing** — `/` — Hero, stats, featured properties, how-it-works, CTA
2. **Marketplace** — `/marketplace` — Filterable property grid with RERA search
3. **Property Detail** — `/marketplace/:slug` — Gallery, funding bar, invest CTA
4. **Investor Dashboard** — `/portal/investor` — Portfolio overview, metrics
5. **Investor Portfolio** — `/portal/investor/portfolio` — Holdings, transactions
6. **Builder Dashboard** — `/portal/builder` — Listing management
7. **Builder Listings** — `/portal/builder/listings` — Property upload
8. **Admin Dashboard** — `/portal/admin` — KYC review, property approvals, stats
9. **Lender Dashboard** — `/portal/investor/lender` — Loan overview
10. **KYC Identity** — `/auth/kyc/identity` — PAN + Aadhaar verification form
11. **Login** — `/auth/login` — Email/password authentication
12. **Signup** — `/auth/signup` — Registration with KYC redirect
13. **Community** — `/community` — Discussion forum with categories
14. **Refer & Earn** — `/referral` — Referral code, stats, history
15. **Settings** — `/settings` — Profile, notifications, security, bank, documents

## Mobile Screens (8 screens)

1. **Home** — Tab: Hero banner, stats, featured properties
2. **Marketplace** — Tab: Search + filter chips, 2-column property grid
3. **Portfolio** — Tab: Summary metrics, asset allocation, holdings
4. **Community** — Tab: Posts feed with upvotes, category filter
5. **Profile** — Tab: KYC banner, referral code, menu items
6. **Property Detail** — Stack: Gallery, key metrics, funding bar, invest CTA
7. **Invest Flow** — Stack: Amount → Review → Payment → Confirmation
8. **KYC Flow** — Stack: Personal → Documents → Selfie

## API Endpoints

| Prefix | Module | Endpoints |
|--------|--------|-----------|
| `/api/v1/auth` | Auth | POST register, login, refresh |
| `/api/v1/properties` | Properties | GET list/featured/cities/detail, POST create, PATCH update |
| `/api/v1/investments` | Investments | GET list/summary/transactions, POST invest/confirm-payment |
| `/api/v1/admin` | Admin | GET stats/users, POST kyc-approve/reject, property-approve/reject |
| `/api/v1/community` | Community | GET posts/replies, POST post/reply/upvote |
| `/api/v1/referrals` | Referrals | GET stats, POST apply |
| `/api/v1/webhooks` | Webhooks | POST clerk, razorpay |

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- Docker & Docker Compose (for local infrastructure)

### 1. Install Web Dependencies

```bash
cd apps/web
npm install --legacy-peer-deps
```

### 2. Run Web Dev Server

```bash
npm run dev
```

### 3. Start Infrastructure (PostgreSQL + Redis)

```bash
docker compose up postgres redis -d
```

### 4. Install Backend Dependencies

```bash
cd services/api
pip install -e .
```

### 5. Run Database Migrations

```bash
cd services/api
alembic upgrade head
```

### 6. Start API Server

```bash
cd services/api
uvicorn app.main:app --reload
```

### 7. Mobile (Expo)

```bash
cd apps/mobile
npm install
npx expo start
```

## Environment Variables

Copy `services/api/.env.example` to `services/api/.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Random 256-bit secret |
| `CLERK_SECRET_KEY` | From Clerk dashboard |
| `RAZORPAY_KEY_ID` | From Razorpay dashboard |
| `RAZORPAY_KEY_SECRET` | From Razorpay dashboard |
| `AWS_ACCESS_KEY_ID` | For S3 document uploads |
| `AWS_SECRET_ACCESS_KEY` | For S3 |
| `AWS_S3_BUCKET` | S3 bucket name |
| `SENTRY_DSN` | (Optional) Sentry error tracking |
| `REDIS_URL` | Redis connection string |

## License

Proprietary — WealthSpot Technologies Pvt. Ltd.
