"""Add explorer_count metric to vault_metrics configuration

Revision ID: 036_vault_explorer_metric
Revises: 035_vault_metrics_config
Create Date: 2026-04-16

Appends 'explorer_count' to the enabled metrics list for each vault type
in the platform_configs table (section='vault_metrics').
"""

from alembic import op

revision = "036_vault_explorer_metric"
down_revision = "035_vault_metrics_config"
branch_labels = None
depends_on = None

# Each vault_metrics config key and the metric list it should gain
UPDATES = {
    "wealth_metrics": "explorer_count",
    "opportunity_metrics": "explorer_count",
    "community_metrics": "explorer_count",
}


def upgrade() -> None:
    for config_key, metric in UPDATES.items():
        # jsonb || to append metric into the metrics array if not already present
        op.execute(
            f"""
            UPDATE platform_configs
            SET value = jsonb_set(
                value,
                '{{metrics}}',
                (value->'metrics') || '"{metric}"'::jsonb
            ),
            updated_at = NOW()
            WHERE section = 'vault_metrics'
              AND key = '{config_key}'
              AND NOT (value->'metrics' @> '"{metric}"'::jsonb)
            """
        )


def downgrade() -> None:
    for config_key, metric in UPDATES.items():
        op.execute(
            f"""
            UPDATE platform_configs
            SET value = jsonb_set(
                value,
                '{{metrics}}',
                (SELECT jsonb_agg(elem)
                 FROM jsonb_array_elements(value->'metrics') elem
                 WHERE elem != '"{metric}"')
            ),
            updated_at = NOW()
            WHERE section = 'vault_metrics'
              AND key = '{config_key}'
              AND (value->'metrics' @> '"{metric}"'::jsonb)
            """
        )
