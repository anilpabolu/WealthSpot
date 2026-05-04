# Alembic Migrations — WealthSpot API

## Layout

- `versions/NNN_*.py` — sequential migrations. The numeric prefix is the
  scheduling order; Alembic's own `down_revision` chain enforces the actual
  dependency graph.
- `env.py` — Alembic environment; loads `app.core.config.settings` and the
  models registered in `app.core.database.Base.metadata`.

---

## Current revision chain tip

`054_opportunity_documents_table` → `053_fk_indexes_and_checks` → ... → `001_initial_schema`

To print the full chain:

```bash
cd services/api
alembic history --verbose
```

---

## Naming convention

```
<NNN>_<short_snake_case_description>.py
```

- `NNN` is a zero-padded three-digit sequence number, monotonically increasing.
- The description should be ≤5 words describing the primary change.
- The `revision` string inside the file must match the filename prefix.

---

## Generating a new revision

```bash
# 1. Change app/models/<model>.py
# 2. Auto-generate (review output before committing):
cd services/api
alembic revision --autogenerate -m "short description"

# 3. Rename to match convention:
mv alembic/versions/<hash>_*.py alembic/versions/<NNN>_short_description.py

# 4. Edit the file:
#    - Set revision = "<NNN>_short_description"
#    - Set down_revision = "<previous_revision_id>"
#    - Review upgrade() / downgrade() carefully
#    - Tag tables carrying per-user data with:
#      # TENANCY: workspace-scope candidate
```

---

## Running migrations

```bash
alembic upgrade head          # apply all pending
alembic upgrade +1            # one step forward
alembic downgrade -1          # one step back
alembic downgrade <revision>  # roll back to specific revision
alembic current               # show current DB revision
alembic history -r current:head  # show pending
```

---

## Downgrade policy

Every migration **must** implement a working `downgrade()` function:

- Structural changes (add column, create table): reverse the DDL.
- Data migrations: write the inverse transform **before** dropping columns.
- `CREATE INDEX`: drop the index in downgrade.
- `DROP COLUMN`: re-add the column in downgrade so the app layer does not
  break immediately after rollback.

---

## Expand/contract pattern for zero-downtime deploys

1. Migration N: add new column/table, copy data, keep old column.
2. Deploy new application code that writes both old and new paths.
3. Migration N+1: drop old column.
4. `downgrade()` of N+1 re-adds the old column and back-fills from the new
   table.

This ensures old code + new schema work for one full deploy cycle.

---

## Multi-tenancy note

Files annotated with `# TENANCY: workspace-scope candidate` flag tables that
carry per-user data.  When multi-tenancy lands, these need a `workspace_id UUID`
column and a composite index.  **Do not add `workspace_id` yet** — just keep
the annotation for a mechanical future grep-and-retrofit.

Latest known head as of 2026-04-27: `053_fk_indexes_and_checks`.

## Common commands

Run from `services/api/`:

```bash
# Show current head and history
alembic current
alembic history --verbose

# Apply all pending migrations
alembic upgrade head

# Step forward / backward by one
alembic upgrade +1
alembic downgrade -1

# Generate a new migration scaffold (we hand-write SQL — autogenerate is
# advisory only)
alembic revision -m "describe what this changes"
```

## Authoring guidance

1. **Always implement `downgrade()`.** If the change can't be reversed
   (e.g. dropping data, cleaning up, normalising JSON), make `downgrade()`
   raise with a clear message rather than silently doing nothing.
2. **Make migrations idempotent** when touching prod-shared resources. Use
   `CREATE INDEX IF NOT EXISTS`, `ALTER TABLE ... ADD CONSTRAINT IF NOT
   EXISTS` (Postgres ≥ 9.6 via `DO` blocks), `ALTER TABLE ... ADD COLUMN IF
   NOT EXISTS`. This survives partial-apply incidents.
3. **Backfills**: keep them in a `op.get_bind().execute(...)` block in the
   same migration so they run in the same transaction. For very large
   backfills (>10M rows), split into a separate migration that batches.
4. **Encryption / PII migrations** should pull `app.services.encryption`
   inside the function, not at module top — the migration runner may run
   without `ENCRYPTION_KEY` available in CI / staging dry-runs.
5. **Adding a NOT NULL** to an existing column requires either a default or
   a 2-step migration (add nullable → backfill → set NOT NULL). Don't do it
   in one shot on a populated table.

## Rollback runbook

If a deployment fails after a migration applied:

1. **Stop traffic** to the affected service (drain via load balancer).
2. **Capture state**:
   ```bash
   alembic current
   pg_dump -U $DB_USER -d $DB_NAME -F c -f rollback-snapshot.dump
   ```
3. **Step back one revision**:
   ```bash
   alembic downgrade -1
   ```
4. If `downgrade()` fails because of orphan data introduced after the
   migration ran, use `alembic stamp <prev_revision>` to mark the schema
   without running code, then hand-correct the schema using SQL.
5. **Restore traffic** once `alembic current` matches the pre-deployment
   revision and a sanity SELECT against affected tables succeeds.

## Convention checklist for reviewers

- [ ] Filename follows `NNN_short_description.py` numbering.
- [ ] `down_revision` points at the actual prior head (no skips).
- [ ] `upgrade()` is idempotent (re-runnable on a partially-applied DB).
- [ ] `downgrade()` exists and reverses the structural change.
- [ ] Backfill is bounded: explicit limit, batching, or guaranteed small N.
- [ ] No use of model classes from `app.models` — Alembic must run against
      a schema that may not match Python model state.
