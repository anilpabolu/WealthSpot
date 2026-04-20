# WealthSpot Shield — 7-Layer Trust Framework

## Context

Investors on WealthSpot park ₹2.5 Cr+ into real-estate / startup / community deals sight-unseen. Every trust lever we pull today — RERA number, builder verified badge, EOI flow — is either a single checkpoint or a marketing claim. Prospective investors have no way to see *what* diligence the platform actually performed on a deal before it went Live.

The platform owner already performs a structured 7-category review of every opportunity before listing (Builder / Legal / Valuation / Location / Property / Security / Exit). Today that work is invisible to investors, opaque to builders, and tracked in notebooks. This feature turns that diligence into the **soul of the product** — a branded, observable, auditable trust surface.

**The brand: "WealthSpot Shield"** — 7 independent layers between an investor and every deal. A listing becomes **Shield Certified** only when all 7 layers are green.

### The 7 Shield Layers

| # | Layer | Performed by | Sub-items |
|---|---|---|---|
| 1 | **Builder** | WealthSpot | Category Grade (A/B/C) · Tenure & sqft delivered · Proprietor profile · Cash flows · Team capabilities |
| 2 | **Legal** | External law firm | Title deeds · Known legal issues · Location constraints · Encumbrance Certificate · Legal opinion letter |
| 3 | **Valuation** | External SMEs | Surrounding valuation · Market value · Future scope of appreciation |
| 4 | **Location** | WealthSpot | Buffer-zone / SC-ST / dotted-land check · Future development (metro, IT parks) |
| 5 | **Property** | WealthSpot | Construction status · Land parcel dimensions · Segment · Timelines |
| 6 | **Security** | WealthSpot | Sale agreement / deeds · Cheque security · MoUs |
| 7 | **Exit** | WealthSpot | Lock-in period · Flexibility · Emergency-exit clause |

Plus a **"Risks you should know"** strip (registrar-office issues · govt decision risks · approval delays).

### User decisions (captured)

- **Brand**: WealthSpot Shield.
- **Builder submit gate**: *All optional at submit.* Builders publish with empty assessments; admin requests evidence during review.
- **Evidence download gating**: Document download unlocks only after super-admin approves the user's EOI on that opportunity.
- **Platforms**: Web + mobile shipped together. Shared types in `packages/wealthspot-types` drive both.

---

## Architecture overview

```
┌─────────────── shared / seed ───────────────┐
│ packages/wealthspot-types/src/assessments.ts │   ← single source of truth
│   ASSESSMENT_CATEGORIES[]                    │     (7 categories × sub-items
│   AssessmentStatus, AssessmentCategoryCode   │      + copy + icons)
└─────────────────────────────────────────────┘
           │                                    │
           ▼ mirrored in Python                 ▼ consumed by web + mobile
┌───── backend (services/api) ─────┐  ┌──── apps/web + apps/mobile ────┐
│ alembic 041_shield_assessments   │  │ hero tiles (marketplace)       │
│ models/opportunity_assessment.py │  │ builder wizard step (optional) │
│ routers/assessments.py           │  │ opp-detail ShieldSection       │
│ routers/uploads.py (+ gated GET) │  │ admin review panel (approvals) │
│ pytest tests/                    │  │ builder listing page columns   │
└──────────────────────────────────┘  │ command-control metrics card   │
                                      └────────────────────────────────┘
```

---

## Data model

### 1. `opportunity_assessments` table

One row per (opportunity, sub-item). The 7 categories and their sub-items live in shared config (not a DB table) — this keeps the schema flat and lets us evolve copy without migrations.

```sql
CREATE TABLE opportunity_assessments (
  id                  UUID PRIMARY KEY,
  opportunity_id      UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  category_code       VARCHAR(30) NOT NULL,
  subcategory_code    VARCHAR(50) NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'not_started',
  builder_answer      JSONB,
  reviewer_note       TEXT,
  reviewed_by         UUID REFERENCES users(id),
  reviewed_at         TIMESTAMPTZ,
  risk_severity       VARCHAR(10),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, subcategory_code)
);
```

### 2. Extend `opportunity_media`

```sql
ALTER TABLE opportunity_media
  ADD COLUMN assessment_category_code    VARCHAR(30),
  ADD COLUMN assessment_subcategory_code VARCHAR(50);
```

### 3. `opportunity_risk_flags` table

```sql
CREATE TABLE opportunity_risk_flags (
  id             UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  label          VARCHAR(100) NOT NULL,
  severity       VARCHAR(10) NOT NULL,
  note           TEXT,
  created_by     UUID NOT NULL REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

An opportunity is **Shield Certified** when every sub-item is `passed` or `not_applicable`.

Migration file: `services/api/alembic/versions/041_shield_assessments.py`.

---

## Shared types

- `packages/wealthspot-types/src/assessments.ts` — TS source of truth for categories, sub-items, enums.
- `services/api/app/core/assessments.py` — Python mirror. A pytest asserts parity.

---

## Backend API

### Router: `services/api/app/routers/assessments.py`

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/opportunities/{id}/assessments` | public | Returns `AssessmentSummary`. Non-EOI-approved users get locked doc URLs. |
| PUT | `/opportunities/{id}/assessments/bulk` | creator | Builder saves/updates answers across sub-items. |
| POST | `/opportunities/{id}/assessments/{subcode}/review` | admin | `{ action: 'pass' \| 'flag' \| 'na', reviewer_note, risk_severity? }`. |
| POST | `/opportunities/{id}/risks` | admin | Create a risk flag. |
| DELETE | `/opportunities/{id}/risks/{riskId}` | admin | Remove a risk flag. |

### Extend `services/api/app/routers/uploads.py`

- `POST /uploads/opportunity/{id}/assessment-document?category=&subcategory=` — creator only.
- `GET /uploads/opportunity/{id}/assessment-document/{mediaId}` — gated:
  - Creator / admin / super_admin: always.
  - Others: allowed only with an EOI in super-admin-advanced status.

### Shield gate in `services/api/app/routers/approvals.py`

On `POST /approvals/{id}/review` with `action=approve` for `resource_type=opportunity`: if any sub-item is incomplete → `409 ASSESSMENT_INCOMPLETE` **unless** `body.override=true`.

### Metrics: `GET /control-centre/shield-metrics`

- Funnel counts: drafted / in_review / certified / rejected.
- Avg time-to-certify per category (last 30 / 90 days).
- Top 5 most-flagged sub-items.
- Risk-flag counts by severity.

Schemas live in `services/api/app/schemas/assessment.py`.

---

## Frontend — web (`apps/web`)

### New files

- `apps/web/src/lib/assessments.ts` — re-exports + lucide icon mapping.
- `apps/web/src/components/shield/`
  - `ShieldDot.tsx`, `ShieldTile.tsx`, `ShieldHeroStrip.tsx`, `ShieldInfoModal.tsx`
  - `ShieldSection.tsx` (opportunity detail page)
  - `ShieldDocLink.tsx` (gated doc download)
  - `BuilderShieldStep.tsx` (wizard step)
  - `AdminShieldReviewPanel.tsx` (approvals drawer)
  - `ShieldMetricsCard.tsx` (dashboards)
- `apps/web/src/hooks/useShield.ts`

### Surface edits

1. **Marketplace hero** — add `<ShieldHeroStrip />` to `MarketplacePage`.
2. **Opportunity detail** — insert `<ShieldSection opportunityId={opp.id} />` above "Developer / Company".
3. **Builder creation wizard** — add optional `'shield'` step in `BuilderListingNewPage`.
4. **Builder listings table** — Shield progress chip column.
5. **Builder listing detail** — read-only `<ShieldSection mode="builder" />`.
6. **Admin review** — `<AdminShieldReviewPanel>` embedded in ApprovalsPage drawer.
7. **Analytics** — `<ShieldMetricsCard />` on AdminDashboard, BuilderAnalytics, CommandControl.

---

## Frontend — mobile (`apps/mobile`)

- `apps/mobile/src/components/shield/` — `ShieldDot`, `ShieldTile`, `ShieldSection`, `ShieldInfoSheet`.
- `apps/mobile/src/hooks/useShield.ts`
- BFF edits: `marketplace.bff.ts`, `portfolio.bff.ts`.

**Screen edits:**
- `apps/mobile/app/(tabs)/marketplace.tsx` — horizontal Shield tile strip.
- Opportunity detail — insert `<ShieldSection>`.
- Builder listings — Shield progress chip.
- Builder opportunity-create flow — optional Shield step with `expo-document-picker`.

---

## Testing strategy

### Backend (pytest)

- `test_assessments_models.py` — constraints / enums.
- `test_assessments_router.py` — list/bulk-save/review; role enforcement.
- `test_uploads_assessment_doc.py` — creator upload; EOI-gated download.
- `test_approvals_shield_gate.py` — 409 incomplete; override=true unblocks.
- `test_assessment_parity.py` — TS vs Py category parity.
- `test_shield_metrics.py` — funnel + top-flagged.

### Frontend (vitest)

- Component tests for each Shield component.
- BFF-level functional tests for `useShield` hooks.

### E2E (Playwright)

- `shield-builder-submit.spec.ts`
- `shield-admin-review.spec.ts`
- `shield-gated-download.spec.ts`

---

## Docker & rollout

1. `docker compose build api`
2. `docker compose run --rm api alembic upgrade head`
3. `docker compose build web`
4. `docker compose up -d api web`

Rollback: revert PR + `alembic downgrade -1`.

---

## Verification checklist

1. **Hero** — marketplace shows 7-tile Shield strip; tile click opens modal.
2. **Builder flow** — optional Shield step; submit works with empty answers.
3. **Admin review** — approve gated by completion; force-override works with reason.
4. **Investor pre-EOI** — sensitive docs show 🔒 lock icon.
5. **Investor post-EOI-approved** — docs downloadable.
6. **Mobile parity** — strip + section + builder chip.
7. **Metrics** — funnel, top-flagged, avg time-to-certify populate.

---

## Out of scope

- PDF report generation for investors post-EOI.
- Email notifications on flagged sub-items.
- Review-cadence / expiry for assessments.
- Public "Shield Certified" social share card.
