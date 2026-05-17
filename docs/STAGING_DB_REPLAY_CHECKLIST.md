# Staging DB Replay Checklist

Use this checklist before production rollout when DB migrations or schema hardening changes are included.

## 1) Governance Gate

Run:

```bash
npm run db:check:sql-migrations
```

Expected:
- Pass with no duplicate base migration numbers.
- Pass with valid filename pattern in `services/api/database/*.sql`.

## 2) Phase-1 Constraint Precheck

Run (against staging DB):

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f services/api/database/prechecks/phase1_constraint_precheck.sql
```

Expected:
- `bad_rows = 0` for `opportunities.target_amount <= 0`
- `bad_rows = 0` for `opportunity_investments.amount <= 0`

## 3) Alembic Status

Run:

```bash
cd services/api
alembic current
alembic history -r current:head
```

Expected:
- Current revision resolves cleanly.
- Pending history output is understood and matches release intent.

## 4) Smoke Validation Hook

Run deployment smoke checks after migration replay:

```bash
bash deployment/scripts/04-validate.sh
```

Expected:
- API `/live`, `/ready`, `/health` checks pass.
- Resource checks pass (when Azure login is available).

## One-command Orchestration

You can run the first 3 steps with the orchestration script:

```bash
python scripts/run_db_replay_check.py --database-url "$DATABASE_URL"
```

Optional smoke hook:

```bash
python scripts/run_db_replay_check.py --database-url "$DATABASE_URL" --smoke-command "bash deployment/scripts/04-validate.sh"
```

If running locally without DB access:

```bash
python scripts/run_db_replay_check.py --skip-psql-precheck --skip-alembic
```

## GitHub Actions Manual Run

Use workflow `Staging DB Replay Check` in GitHub Actions for an operator-driven full replay run:

1. Open Actions -> `Staging DB Replay Check`.
1. Click `Run workflow`.
1. Set `confirm` to `replay-staging`.
1. Provide target Key Vault name and DB secret name (current default is `wealthspot-kv-prod` and `database-url`).
1. Override `keyvault_name` when a dedicated staging vault exists.
1. Optionally set `run_smoke=true`.
1. Keep default `smoke_command` as `bash deployment/scripts/04-validate.sh` on Linux runners, or provide a PowerShell-compatible command when needed.

The workflow:
- logs in with OIDC,
- reads `DATABASE_URL` from Key Vault,
- runs `python scripts/run_db_replay_check.py` with full checks,
- and publishes a run summary.
