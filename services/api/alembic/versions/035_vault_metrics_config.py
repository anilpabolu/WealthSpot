"""Seed vault_metrics configuration into platform_configs

Revision ID: 035_vault_metrics_config
Revises: 034_opportunity_archived_status
Create Date: 2026-04-14

Inserts default metric selections per vault into the platform_configs
table (section='vault_metrics'). Admins can toggle metrics on/off via
the Control Centre.
"""

from alembic import op
import json
import uuid

revision = "035_vault_metrics_config"
down_revision = "034_opportunity_archived_status"
branch_labels = None
depends_on = None

SEED = [
    {
        "section": "vault_metrics",
        "key": "wealth_metrics",
        "value": json.dumps({
            "metrics": [
                "total_invested",
                "investor_count",
                "properties_listed",
            ]
        }),
        "description": "Enabled metrics shown on the Wealth Vault card",
    },
    {
        "section": "vault_metrics",
        "key": "opportunity_metrics",
        "value": json.dumps({
            "metrics": [
                "total_invested",
                "investor_count",
                "startups_listed",
            ]
        }),
        "description": "Enabled metrics shown on the Opportunity Vault card",
    },
    {
        "section": "vault_metrics",
        "key": "community_metrics",
        "value": json.dumps({
            "metrics": [
                "total_invested",
                "investor_count",
                "projects_launched",
                "co_investors",
            ]
        }),
        "description": "Enabled metrics shown on the Community Vault card",
    },
]


def upgrade() -> None:
    for row in SEED:
        op.execute(
            f"""
            INSERT INTO platform_configs (id, section, key, value, description, is_active, created_at, updated_at)
            VALUES (
                '{uuid.uuid4()}',
                '{row["section"]}',
                '{row["key"]}',
                '{row["value"]}'::jsonb,
                '{row["description"]}',
                true,
                NOW(),
                NOW()
            )
            ON CONFLICT (section, key) DO NOTHING
            """
        )


def downgrade() -> None:
    op.execute(
        "DELETE FROM platform_configs WHERE section = 'vault_metrics' "
        "AND key IN ('wealth_metrics', 'opportunity_metrics', 'community_metrics')"
    )
