"""Add archetype columns and seed additional profiling questions

Revision ID: 025_profiling_enhancements
Revises: 024_profiling_matching
Create Date: 2026-04-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "025_profiling_enhancements"
down_revision: Union[str, None] = "024_profiling_matching"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Schema changes ─────────────────────────────────────────────────
    op.add_column("personality_dimensions", sa.Column("archetype_label", sa.String(50), nullable=True))
    op.add_column("personality_dimensions", sa.Column("archetype_description", sa.Text, nullable=True))
    op.add_column("profile_match_scores", sa.Column("archetype_compatibility", sa.String(50), nullable=True))

    # ── Seed additional profiling questions ─────────────────────────────
    conn = op.get_bind()
    conn.exec_driver_sql("""
        INSERT INTO vault_profile_questions (vault_type, category, question_text, question_type, options, weight, dimension, sort_order, fun_fact, illustration) VALUES

        -- ── WEALTH VAULT (4 new questions, sort_order 7-10) ──────────────

        ('wealth', 'financial', 'Which asset class mix appeals to you most?', 'multi_choice',
         '[{"value":"residential","label":"Residential Apartments","weight":0.7,"emoji":"🏠"},{"value":"commercial","label":"Commercial Offices","weight":0.85,"emoji":"🏢"},{"value":"warehousing","label":"Warehousing & Logistics","weight":0.8,"emoji":"🏭"},{"value":"plotted","label":"Plotted Development","weight":0.75,"emoji":"🗺️"},{"value":"mixed","label":"Mixed-Use Projects","weight":0.9,"emoji":"🏗️"}]',
         1.3, 'domain_expertise', 7, 'Diversifying across asset classes can reduce portfolio risk by up to 30%.', 'industry'),

        ('wealth', 'financial', 'How diversified is your current investment portfolio?', 'choice',
         '[{"value":"all_one","label":"All in one basket","weight":0.2,"emoji":"🥚"},{"value":"moderate","label":"Moderately diversified (2-3 asset types)","weight":0.5,"emoji":"🧺"},{"value":"well","label":"Well diversified (4-5 asset types)","weight":0.8,"emoji":"📊"},{"value":"ultra","label":"Ultra diversified — stocks, bonds, RE, gold, crypto","weight":1.0,"emoji":"🌐"}]',
         1.0, 'investment_capacity', 8, 'The average HNI in India has 4.2 asset classes in their portfolio.', 'balance'),

        ('wealth', 'personality', 'How do you typically make investment decisions?', 'choice',
         '[{"value":"gut","label":"Gut feeling & instinct","weight":0.4,"emoji":"🎯"},{"value":"research","label":"Independent research & analysis","weight":0.7,"emoji":"🔬"},{"value":"advisor","label":"Expert advisor recommendations","weight":0.6,"emoji":"👨‍💼"},{"value":"data","label":"Pure data-driven, quantitative models","weight":1.0,"emoji":"📈"}]',
         1.1, 'domain_expertise', 9, 'Studies show combining data analysis with expert advice yields the best results.', 'brain'),

        ('wealth', 'personality', 'What trait do you value most in a co-investor?', 'choice',
         '[{"value":"deep_pockets","label":"Deep pockets — can scale up fast","weight":0.6,"emoji":"💰"},{"value":"domain","label":"Domain knowledge — knows the market inside out","weight":0.9,"emoji":"🧠"},{"value":"access","label":"Market access — opens doors to deals","weight":0.8,"emoji":"🚪"},{"value":"vision","label":"Long-term vision — patient & strategic","weight":0.85,"emoji":"🔭"}]',
         0.8, 'collaboration_score', 10, 'Great partnerships balance patience with ambition.', 'handshake'),

        -- ── COMMUNITY VAULT (2 new questions, sort_order 9-10) ──────────

        ('community', 'creative', 'If your community project had a theme song, it would be...', 'choice',
         '[{"value":"eye_tiger","label":"Eye of the Tiger — fierce determination 🐯","weight":0.85,"emoji":"🐯"},{"value":"imagine","label":"Imagine — dreaming big together 🌈","weight":0.7,"emoji":"🌈"},{"value":"we_will","label":"We Will Rock You — unstoppable energy ⚡","weight":0.9,"emoji":"⚡"},{"value":"dont_stop","label":"Don''t Stop Believin'' — eternal optimists 🌟","weight":0.8,"emoji":"🌟"},{"value":"bohemian","label":"Bohemian Rhapsody — expect the unexpected 🎭","weight":1.0,"emoji":"🎭"}]',
         0.9, 'creativity_score', 9, 'Music preferences correlate surprisingly well with leadership style!', 'stars'),

        ('community', 'personality', 'When conflicts arise in a team, you tend to...', 'choice',
         '[{"value":"compromise","label":"Find a middle ground — everyone wins a little","weight":0.7,"emoji":"🤝"},{"value":"assert","label":"Stand firm on what I believe is right","weight":0.6,"emoji":"💪"},{"value":"collaborate","label":"Dig deeper — find a solution that makes everyone happy","weight":1.0,"emoji":"🧩"},{"value":"mediate","label":"Listen to all sides and mediate","weight":0.9,"emoji":"👂"},{"value":"delegate","label":"Let the best expert decide","weight":0.8,"emoji":"🎓"}]',
         1.2, 'leadership_score', 10, 'Teams that resolve conflicts through collaboration outperform by 3x.', 'balance'),

        -- ── OPPORTUNITY VAULT (6 new questions, sort_order 5-10) ─────────

        ('opportunity', 'financial', 'What''s your typical ticket size for startup investments?', 'choice',
         '[{"value":"under_1l","label":"Under ₹1 Lakh","weight":0.3,"emoji":"🌱"},{"value":"1l_5l","label":"₹1L – ₹5 Lakh","weight":0.5,"emoji":"🌿"},{"value":"5l_25l","label":"₹5L – ₹25 Lakh","weight":0.8,"emoji":"🌳"},{"value":"25l_plus","label":"₹25 Lakh+","weight":1.0,"emoji":"🏔️"}]',
         1.5, 'investment_capacity', 5, 'The average angel investment in India is ₹10-15 Lakh.', 'coins'),

        ('opportunity', 'skills', 'How do you evaluate a founding team?', 'choice',
         '[{"value":"track_record","label":"Track record & past exits","weight":0.9,"emoji":"🏆"},{"value":"passion","label":"Passion & hustle — fire in the belly","weight":0.7,"emoji":"🔥"},{"value":"market","label":"Deep market understanding","weight":0.85,"emoji":"🧭"},{"value":"tech","label":"Technical depth & innovation","weight":0.8,"emoji":"⚙️"}]',
         1.3, 'domain_expertise', 6, 'The #1 reason startups fail is team dysfunction, not bad ideas.', 'team'),

        ('opportunity', 'financial', 'What''s your preferred exit timeline for startup investments?', 'choice',
         '[{"value":"2_3y","label":"2-3 years — quick flip","weight":0.4,"emoji":"⚡"},{"value":"3_5y","label":"3-5 years — standard cycle","weight":0.6,"emoji":"📅"},{"value":"5_7y","label":"5-7 years — patient capital","weight":0.8,"emoji":"🕰️"},{"value":"7_plus","label":"7+ years — I''m in it for the long haul","weight":1.0,"emoji":"🏰"}]',
         1.0, 'time_commitment', 7, 'Most successful startup exits happen between year 5 and year 8.', 'calendar'),

        ('opportunity', 'skills', 'How many startups have you invested in before?', 'choice',
         '[{"value":"none","label":"This would be my first! 🎉","weight":0.3,"emoji":"🎉"},{"value":"1_3","label":"1-3 startups","weight":0.5,"emoji":"✌️"},{"value":"4_10","label":"4-10 startups","weight":0.8,"emoji":"🎯"},{"value":"10_plus","label":"10+ startups — seasoned angel","weight":1.0,"emoji":"👼"}]',
         1.1, 'domain_expertise', 8, 'Experienced angels who''ve invested in 10+ startups have a 3x higher success rate.', 'rocket'),

        ('opportunity', 'personality', 'How connected are you to the startup ecosystem?', 'choice',
         '[{"value":"no_connections","label":"Not connected — looking to start","weight":0.2,"emoji":"🚶"},{"value":"know_few","label":"Know a few founders personally","weight":0.5,"emoji":"🤝"},{"value":"well_connected","label":"Well connected — VCs, accelerators, founders","weight":0.8,"emoji":"🌐"},{"value":"deeply_embedded","label":"Deeply embedded — I AM the ecosystem","weight":1.0,"emoji":"🕸️"}]',
         1.2, 'network_strength', 9, 'Your network is your net worth — especially in startup investing.', 'globe'),

        ('opportunity', 'personality', 'Beyond returns, what motivates you to invest in startups?', 'choice',
         '[{"value":"returns","label":"Pure financial returns — show me the money","weight":0.5,"emoji":"💰"},{"value":"innovation","label":"Being part of innovation that changes the world","weight":0.9,"emoji":"🌍"},{"value":"founders","label":"Supporting passionate founders","weight":0.8,"emoji":"❤️"},{"value":"learning","label":"Learning about new industries & technologies","weight":0.7,"emoji":"🎓"}]',
         0.9, 'creativity_score', 10, 'Investors driven by more than just returns tend to make better decisions.', 'lightbulb')

        ON CONFLICT DO NOTHING;
    """)


def downgrade() -> None:
    op.drop_column("profile_match_scores", "archetype_compatibility")
    op.drop_column("personality_dimensions", "archetype_description")
    op.drop_column("personality_dimensions", "archetype_label")
