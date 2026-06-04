"""Create opportunity_form_options table and seed all 11 option groups.

Revision ID: 063_opportunity_form_options
Revises: 062_fix_eoi_form_options_seed
Create Date: 2026-05-05
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa

from alembic import op

revision: str = "063_opportunity_form_options"
down_revision: Union[str, None] = "062_fix_eoi_form_options_seed"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "opportunity_form_options",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("field_name", sa.String(50), nullable=False, index=True),
        sa.Column("value", sa.String(100), nullable=False),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=True,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint("field_name", "value", name="uq_opp_form_options_field_value"),
    )

    op.execute("""
        INSERT INTO opportunity_form_options (id, field_name, value, label, sort_order) VALUES
        -- community_type
        (gen_random_uuid(), 'community_type', 'sports_complex',    'Sports Complex',    1),
        (gen_random_uuid(), 'community_type', 'coworking_space',   'Co-working Space',  2),
        (gen_random_uuid(), 'community_type', 'local_business',    'Local Business',    3),
        (gen_random_uuid(), 'community_type', 'education_centre',  'Education Centre',  4),
        (gen_random_uuid(), 'community_type', 'healthcare',        'Healthcare',        5),
        (gen_random_uuid(), 'community_type', 'agriculture',       'Agriculture',       6),
        (gen_random_uuid(), 'community_type', 'other',             'Other',             7),
        -- collaboration_type
        (gen_random_uuid(), 'collaboration_type', 'capital_and_time',  'Capital + Time',      1),
        (gen_random_uuid(), 'collaboration_type', 'capital_only',      'Capital Only',        2),
        (gen_random_uuid(), 'collaboration_type', 'time_and_network',  'Time + Network',      3),
        (gen_random_uuid(), 'collaboration_type', 'full_collaboration','Full Collaboration',  4),
        -- investment_tenure
        (gen_random_uuid(), 'investment_tenure', '6_months', '6 Months', 1),
        (gen_random_uuid(), 'investment_tenure', '1_year',   '1 Year',   2),
        (gen_random_uuid(), 'investment_tenure', '2_years',  '2 Years',  3),
        (gen_random_uuid(), 'investment_tenure', '3_years',  '3 Years',  4),
        (gen_random_uuid(), 'investment_tenure', '5_years',  '5 Years',  5),
        (gen_random_uuid(), 'investment_tenure', '7_years',  '7 Years',  6),
        -- revenue_model
        (gen_random_uuid(), 'revenue_model', 'rental_income',     'Rental Income',       1),
        (gen_random_uuid(), 'revenue_model', 'profit_sharing',    'Profit Sharing',      2),
        (gen_random_uuid(), 'revenue_model', 'membership_fees',   'Membership Fees',     3),
        (gen_random_uuid(), 'revenue_model', 'revenue_share',     'Revenue Share',       4),
        (gen_random_uuid(), 'revenue_model', 'equity_appreciation','Equity Appreciation',5),
        (gen_random_uuid(), 'revenue_model', 'other',             'Other',               6),
        -- legal_structure
        (gen_random_uuid(), 'legal_structure', 'llp',               'LLP',               1),
        (gen_random_uuid(), 'legal_structure', 'private_limited',   'Private Limited',   2),
        (gen_random_uuid(), 'legal_structure', 'trust',             'Trust',             3),
        (gen_random_uuid(), 'legal_structure', 'partnership_firm',  'Partnership Firm',  4),
        (gen_random_uuid(), 'legal_structure', 'huf',               'HUF',               5),
        (gen_random_uuid(), 'legal_structure', 'sole_proprietorship','Sole Proprietorship',6),
        (gen_random_uuid(), 'legal_structure', 'other',             'Other',             7),
        -- risk_level
        (gen_random_uuid(), 'risk_level', 'low',           'Low',           1),
        (gen_random_uuid(), 'risk_level', 'low_moderate',  'Low–Moderate',  2),
        (gen_random_uuid(), 'risk_level', 'moderate',      'Moderate',      3),
        (gen_random_uuid(), 'risk_level', 'moderate_high', 'Moderate–High', 4),
        (gen_random_uuid(), 'risk_level', 'high',          'High',          5),
        -- projected_timeline
        (gen_random_uuid(), 'projected_timeline', '3_months',  '3 Months',  1),
        (gen_random_uuid(), 'projected_timeline', '6_months',  '6 Months',  2),
        (gen_random_uuid(), 'projected_timeline', '1_year',    '1 Year',    3),
        (gen_random_uuid(), 'projected_timeline', '18_months', '18 Months', 4),
        (gen_random_uuid(), 'projected_timeline', '2_years',   '2 Years',   5),
        (gen_random_uuid(), 'projected_timeline', '3_years',   '3 Years',   6),
        (gen_random_uuid(), 'projected_timeline', '5_years',   '5 Years',   7),
        -- time_commitment
        (gen_random_uuid(), 'time_commitment', 'part_time',  'Part-time (< 10 hrs/week)',       1),
        (gen_random_uuid(), 'time_commitment', 'half_time',  'Half-time (10–20 hrs/week)',      2),
        (gen_random_uuid(), 'time_commitment', 'full_time',  'Full-time (20–40 hrs/week)',      3),
        (gen_random_uuid(), 'time_commitment', 'on_call',    'On-call / Flexible',              4),
        -- partnership_duration
        (gen_random_uuid(), 'partnership_duration', '3_months',   '3 Months',   1),
        (gen_random_uuid(), 'partnership_duration', '6_months',   '6 Months',   2),
        (gen_random_uuid(), 'partnership_duration', '1_year',     '1 Year',     3),
        (gen_random_uuid(), 'partnership_duration', '2_years',    '2 Years',    4),
        (gen_random_uuid(), 'partnership_duration', '3_years',    '3 Years',    5),
        (gen_random_uuid(), 'partnership_duration', '5_years',    '5 Years',    6),
        (gen_random_uuid(), 'partnership_duration', 'open_ended', 'Open-ended', 7),
        -- decision_authority
        (gen_random_uuid(), 'decision_authority', 'equal_say',           'Equal say',               1),
        (gen_random_uuid(), 'decision_authority', 'majority_vote',       'Majority vote',            2),
        (gen_random_uuid(), 'decision_authority', 'lead_partner_decides','Lead partner decides',     3),
        (gen_random_uuid(), 'decision_authority', 'advisory_only',       'Advisory only',            4),
        -- partner_skill
        (gen_random_uuid(), 'partner_skill', 'project_management',  'Project Management',    1),
        (gen_random_uuid(), 'partner_skill', 'marketing_sales',     'Marketing & Sales',     2),
        (gen_random_uuid(), 'partner_skill', 'finance_accounting',  'Finance & Accounting',  3),
        (gen_random_uuid(), 'partner_skill', 'legal_compliance',    'Legal & Compliance',    4),
        (gen_random_uuid(), 'partner_skill', 'technology_it',       'Technology & IT',       5),
        (gen_random_uuid(), 'partner_skill', 'operations',          'Operations',            6),
        (gen_random_uuid(), 'partner_skill', 'design_creative',     'Design & Creative',     7),
        (gen_random_uuid(), 'partner_skill', 'business_development','Business Development',  8),
        (gen_random_uuid(), 'partner_skill', 'hr_talent',           'HR & Talent',           9),
        (gen_random_uuid(), 'partner_skill', 'domain_expertise',    'Domain Expertise',      10),
        (gen_random_uuid(), 'partner_skill', 'other',               'Other',                 11)
        ON CONFLICT (field_name, value) DO NOTHING
    """)


def downgrade() -> None:
    op.drop_table("opportunity_form_options")
