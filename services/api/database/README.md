# Database Scripts

This directory contains standalone SQL scripts for WealthSpot's PostgreSQL database.

## Files

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Full DDL: enums, 10 tables, indexes, constraints, triggers |
| `002_seed_data.sql` | Realistic dev/demo data (6 users, 4 properties, investments, etc.) |

## Quick Start (Docker)

```bash
# Start PostgreSQL via Docker Compose (from project root)
docker compose up -d postgres

# Apply schema
docker compose exec -T postgres psql -U wealthspot -d wealthspot < services/api/database/001_initial_schema.sql

# Load seed data
docker compose exec -T postgres psql -U wealthspot -d wealthspot < services/api/database/002_seed_data.sql
```

## Quick Start (Local PostgreSQL)

```bash
# Create database
createdb -U postgres wealthspot

# Apply schema
psql -U postgres -d wealthspot -f services/api/database/001_initial_schema.sql

# Load seed data
psql -U postgres -d wealthspot -f services/api/database/002_seed_data.sql
```

## Using Alembic Instead

These SQL scripts and Alembic migrations target the same schema. Use **one or the other**, not both.

```bash
cd services/api
alembic upgrade head     # applies migrations from alembic/versions/
```

## Notes

- Requires PostgreSQL 16+ with `uuid-ossp` and `pgcrypto` extensions.
- `updated_at` columns are auto-managed by triggers.
- Seed data uses deterministic UUIDs (`a0000000-…`, `b0000000-…`, etc.) for easy cross-referencing.
