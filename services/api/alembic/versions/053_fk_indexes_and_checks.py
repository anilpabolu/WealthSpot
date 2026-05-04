"""Add indexes on foreign keys and CHECK constraints on monetary columns.

Foreign-key columns without an index force sequential scans on join + cascade
delete, which gets quadratic as a workspace fills up. This migration backfills
the high-traffic FK indexes flagged by the audit, plus a few CHECK constraints
that prevent obviously-bad values (negative money, negative target amount).

Uses CREATE INDEX IF NOT EXISTS / DO blocks so the migration is idempotent
across environments where some indexes were added manually.

Revision ID: 053_fk_indexes_and_checks
Revises: 052_encrypt_pan
Create Date: 2026-04-27 13:00:00.000000
"""

from __future__ import annotations

from typing import Union

from alembic import op

revision: str = "053_fk_indexes_and_checks"
down_revision: Union[str, None] = "052_encrypt_pan"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


# (index_name, table, column) — must be valid Postgres identifiers.
# TENANCY: workspace-scope candidate — when multi-tenant arrives, replace
# these single-column indexes with composite (workspace_id, fk_col) indexes.
_INDEXES: list[tuple[str, str, str]] = [
    ("ix_opportunities_approval_id", "opportunities", "approval_id"),
    ("ix_opportunities_creator_id", "opportunities", "creator_id"),
    ("ix_opportunities_company_id", "opportunities", "company_id"),
    ("ix_builder_questions_opportunity_id", "builder_questions", "opportunity_id"),
    ("ix_builder_questions_user_id", "builder_questions", "user_id"),
    ("ix_users_referred_by", "users", "referred_by"),
    ("ix_users_builder_approved_by", "users", "builder_approved_by"),
    ("ix_appreciation_events_opportunity_id", "appreciation_events", "opportunity_id"),
    ("ix_appreciation_events_property_id", "appreciation_events", "property_id"),
    ("ix_appreciation_events_actor_id", "appreciation_events", "actor_id"),
    ("ix_approval_requests_requester_id", "approval_requests", "requester_id"),
    ("ix_approval_requests_assigned_to", "approval_requests", "assigned_to"),
    ("ix_app_videos_uploaded_by", "app_videos", "uploaded_by"),
    ("ix_builder_updates_opportunity_id", "builder_updates", "opportunity_id"),
    ("ix_builder_updates_creator_id", "builder_updates", "creator_id"),
    ("ix_eoi_stage_history_eoi_id", "eoi_stage_history", "eoi_id"),
    ("ix_eoi_stage_history_actor_id", "eoi_stage_history", "actor_id"),
    ("ix_expressions_of_interest_user_id", "expressions_of_interest", "user_id"),
    ("ix_expressions_of_interest_opportunity_id", "expressions_of_interest", "opportunity_id"),
    ("ix_community_posts_author_id", "community_posts", "author_id"),
    ("ix_community_posts_approval_id", "community_posts", "approval_id"),
    ("ix_community_replies_post_id", "community_replies", "post_id"),
    ("ix_companies_approval_id", "companies", "approval_id"),
    ("ix_companies_owner_id", "companies", "owner_id"),
]

# (table, constraint_name, expression)
_CHECK_CONSTRAINTS: list[tuple[str, str, str]] = [
    ("opportunities", "ck_opportunities_target_amount_nonneg", "target_amount IS NULL OR target_amount >= 0"),
    ("opportunities", "ck_opportunities_raised_amount_nonneg", "raised_amount IS NULL OR raised_amount >= 0"),
    ("investments", "ck_investments_amount_positive", "amount > 0"),
    ("expressions_of_interest", "ck_eoi_amount_nonneg", "investment_amount IS NULL OR investment_amount >= 0"),
]


def upgrade() -> None:
    bind = op.get_bind()

    for index_name, table, column in _INDEXES:
        # Only create the index if the table+column actually exist; older
        # branches may not have all of them.
        bind.execute(  # noqa: S608  (we control all identifiers)
            __import__("sqlalchemy").text(
                f"""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = '{table}' AND column_name = '{column}'
                    ) THEN
                        EXECUTE 'CREATE INDEX IF NOT EXISTS {index_name} ON {table}({column})';
                    END IF;
                END
                $$;
                """
            )
        )

    for table, name, expr in _CHECK_CONSTRAINTS:
        bind.execute(
            __import__("sqlalchemy").text(
                f"""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = '{name}'
                    ) AND EXISTS (
                        SELECT 1 FROM information_schema.tables WHERE table_name = '{table}'
                    ) THEN
                        EXECUTE 'ALTER TABLE {table} ADD CONSTRAINT {name} CHECK ({expr})';
                    END IF;
                END
                $$;
                """
            )
        )


def downgrade() -> None:
    bind = op.get_bind()

    for table, name, _ in _CHECK_CONSTRAINTS:
        bind.execute(
            __import__("sqlalchemy").text(
                f"ALTER TABLE IF EXISTS {table} DROP CONSTRAINT IF EXISTS {name}"
            )
        )

    for index_name, _, _ in _INDEXES:
        bind.execute(
            __import__("sqlalchemy").text(f"DROP INDEX IF EXISTS {index_name}")
        )
