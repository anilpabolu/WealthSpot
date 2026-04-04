"""Vault profiling, dynamic questions & profile matching

Revision ID: 024_profiling_matching
Revises: 023_analytics_views
Create Date: 2025-08-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "024_profiling_matching"
down_revision: Union[str, None] = "023_analytics_views"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Vault Profiling Questions
    op.create_table(
        "vault_profile_questions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("vault_type", sa.String(20), nullable=False),
        sa.Column("category", sa.String(50), nullable=False, server_default="general"),
        sa.Column("question_text", sa.Text, nullable=False),
        sa.Column("question_type", sa.String(20), nullable=False, server_default="choice"),
        sa.Column("options", JSONB, nullable=True),
        sa.Column("weight", sa.Numeric(4, 2), nullable=False, server_default="1.0"),
        sa.Column("dimension", sa.String(50), nullable=True),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_required", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("fun_fact", sa.Text, nullable=True),
        sa.Column("illustration", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_vpq_vault_active", "vault_profile_questions", ["vault_type", "is_active", "sort_order"])

    # 2. User Profile Answers
    op.create_table(
        "user_profile_answers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", UUID(as_uuid=True), sa.ForeignKey("vault_profile_questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("vault_type", sa.String(20), nullable=False),
        sa.Column("answer_value", JSONB, nullable=False),
        sa.Column("answer_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "question_id", name="uq_user_profile_answer"),
    )
    op.create_index("idx_upa_user_vault", "user_profile_answers", ["user_id", "vault_type"])

    # 3. Opportunity Custom Questions
    op.create_table(
        "opportunity_custom_questions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("opportunity_id", UUID(as_uuid=True), sa.ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("creator_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_text", sa.Text, nullable=False),
        sa.Column("question_type", sa.String(20), nullable=False, server_default="text"),
        sa.Column("options", JSONB, nullable=True),
        sa.Column("weight", sa.Numeric(4, 2), nullable=False, server_default="1.0"),
        sa.Column("dimension", sa.String(50), nullable=True),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_required", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("is_auto_generated", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("source_hint", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("idx_ocq_opportunity", "opportunity_custom_questions", ["opportunity_id", "sort_order"])

    # 4. Opportunity Application Answers
    op.create_table(
        "opportunity_application_answers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("opportunity_id", UUID(as_uuid=True), sa.ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("question_id", UUID(as_uuid=True), sa.ForeignKey("opportunity_custom_questions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("answer_value", JSONB, nullable=False),
        sa.Column("answer_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "question_id", name="uq_opp_application_answer"),
    )
    op.create_index("idx_oaa_user_opp", "opportunity_application_answers", ["user_id", "opportunity_id"])

    # 5. Profile Match Scores
    op.create_table(
        "profile_match_scores",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("opportunity_id", UUID(as_uuid=True), sa.ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False),
        sa.Column("overall_score", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("dimension_scores", JSONB, nullable=False, server_default="{}"),
        sa.Column("breakdown", JSONB, nullable=True),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "opportunity_id", name="uq_profile_match_score"),
    )
    op.create_index("idx_pms_opportunity_score", "profile_match_scores", ["opportunity_id", sa.text("overall_score DESC")])
    op.create_index("idx_pms_user", "profile_match_scores", ["user_id"])

    # 6. Personality Dimensions
    op.create_table(
        "personality_dimensions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("vault_type", sa.String(20), nullable=False),
        sa.Column("risk_appetite", sa.Numeric(5, 2), server_default="0"),
        sa.Column("domain_expertise", sa.Numeric(5, 2), server_default="0"),
        sa.Column("investment_capacity", sa.Numeric(5, 2), server_default="0"),
        sa.Column("time_commitment", sa.Numeric(5, 2), server_default="0"),
        sa.Column("network_strength", sa.Numeric(5, 2), server_default="0"),
        sa.Column("creativity_score", sa.Numeric(5, 2), server_default="0"),
        sa.Column("leadership_score", sa.Numeric(5, 2), server_default="0"),
        sa.Column("collaboration_score", sa.Numeric(5, 2), server_default="0"),
        sa.Column("raw_dimensions", JSONB, nullable=False, server_default="{}"),
        sa.Column("computed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "vault_type", name="uq_personality_dim_user_vault"),
    )
    op.create_index("idx_pd_user", "personality_dimensions", ["user_id"])

    # ── Seed: Default Vault Profiling Questions ──────────────────────────
    # Use exec_driver_sql to bypass SQLAlchemy's bind-parameter parsing
    # (JSONB contains "weight":0.3 which sa.text() misinterprets as :0 bind param)
    conn = op.get_bind()
    conn.exec_driver_sql("""
        INSERT INTO vault_profile_questions (vault_type, category, question_text, question_type, options, weight, dimension, sort_order, fun_fact, illustration) VALUES

        -- WEALTH VAULT Questions
        ('wealth', 'financial', 'What''s your annual investment budget?', 'choice',
         '[{"value":"under_5l","label":"Under ₹5 Lakh","weight":0.3,"emoji":"🌱"},{"value":"5l_25l","label":"₹5L – ₹25 Lakh","weight":0.6,"emoji":"🌿"},{"value":"25l_1cr","label":"₹25L – ₹1 Crore","weight":0.85,"emoji":"🌳"},{"value":"above_1cr","label":"Above ₹1 Crore","weight":1.0,"emoji":"🏔️"}]',
         1.5, 'investment_capacity', 1, '80% of Indian HNIs prefer real estate as their primary asset class!', 'coins'),

        ('wealth', 'risk', 'How do you react when your investment drops 20% in a month?', 'choice',
         '[{"value":"panic_sell","label":"Sell immediately — protect capital","weight":0.2,"emoji":"😰"},{"value":"anxious_hold","label":"Worried but hold tight","weight":0.5,"emoji":"😟"},{"value":"calm_hold","label":"Stay calm, it''ll recover","weight":0.8,"emoji":"😌"},{"value":"buy_more","label":"Time to buy the dip!","weight":1.0,"emoji":"🤑"}]',
         1.8, 'risk_appetite', 2, 'Warren Buffett says "Be fearful when others are greedy, and greedy when others are fearful."', 'mountain'),

        ('wealth', 'financial', 'What''s your preferred investment horizon?', 'choice',
         '[{"value":"under_1y","label":"Under 1 year","weight":0.3,"emoji":"⚡"},{"value":"1_3y","label":"1–3 years","weight":0.6,"emoji":"🏃"},{"value":"3_7y","label":"3–7 years","weight":0.85,"emoji":"🚀"},{"value":"above_7y","label":"7+ years","weight":1.0,"emoji":"🌅"}]',
         1.2, 'investment_capacity', 3, 'Real estate historically delivers best returns in 5-10 year cycles.', 'calendar'),

        ('wealth', 'personality', 'Which best describes your investment style?', 'choice',
         '[{"value":"conservative","label":"Safety first — steady returns","weight":0.3,"emoji":"🛡️"},{"value":"balanced","label":"Mix of stable & growth","weight":0.6,"emoji":"⚖️"},{"value":"growth","label":"Higher risk, higher reward","weight":0.85,"emoji":"📈"},{"value":"aggressive","label":"Moon or bust!","weight":1.0,"emoji":"🚀"}]',
         1.5, 'risk_appetite', 4, NULL, 'shield'),

        ('wealth', 'skills', 'What''s your expertise in real estate?', 'choice',
         '[{"value":"novice","label":"Complete beginner","weight":0.2,"emoji":"🐣"},{"value":"basic","label":"Know the basics","weight":0.5,"emoji":"📚"},{"value":"intermediate","label":"Invested before","weight":0.8,"emoji":"🏠"},{"value":"expert","label":"Real estate pro","weight":1.0,"emoji":"🏗️"}]',
         1.0, 'domain_expertise', 5, NULL, 'book'),

        ('wealth', 'personality', 'How important is passive income vs capital gains to you?', 'slider',
         '{"min":0,"max":100,"minLabel":"Only Rental Income 🏡","maxLabel":"Only Capital Gains 📈","step":10}',
         0.8, 'risk_appetite', 6, 'A balanced portfolio typically has 60% growth + 40% income assets.', 'balance'),

        -- COMMUNITY VAULT Questions
        ('community', 'creative', 'If your investment style were a superhero, who would it be?', 'choice',
         '[{"value":"iron_man","label":"Iron Man — strategic, tech-savvy, big bets","weight":0.9,"emoji":"🦾"},{"value":"captain","label":"Captain America — reliable, team player, long-term","weight":0.7,"emoji":"🛡️"},{"value":"spider_man","label":"Spider-Man — agile, community-driven, scrappy","weight":0.6,"emoji":"🕷️"},{"value":"hulk","label":"Hulk — all-in, high risk, high reward","weight":1.0,"emoji":"💪"}]',
         1.0, 'risk_appetite', 1, 'Fun fact: 73% of community investors identify as "Captain America" types!', 'superhero'),

        ('community', 'creative', 'You have ₹10L and 1 year. What do you build?', 'choice',
         '[{"value":"cafe","label":"A cozy community café ☕","weight":0.7,"emoji":"☕"},{"value":"sports","label":"A neighbourhood sports complex 🏏","weight":0.8,"emoji":"🏏"},{"value":"cowork","label":"A vibrant co-working space 💻","weight":0.75,"emoji":"💻"},{"value":"farm","label":"An urban farming project 🌾","weight":0.65,"emoji":"🌾"},{"value":"something_wild","label":"Something nobody''s thought of! 🤯","weight":1.0,"emoji":"🤯"}]',
         1.3, 'creativity_score', 2, 'The most successful community projects are driven by passion, not just profit!', 'lightbulb'),

        ('community', 'personality', 'In a group project, you''re usually the...', 'choice',
         '[{"value":"leader","label":"Leader — I rally the troops 🎯","weight":1.0,"emoji":"🎯"},{"value":"executor","label":"Executor — I get things done 🔨","weight":0.85,"emoji":"🔨"},{"value":"networker","label":"Connector — I know everyone 🤝","weight":0.8,"emoji":"🤝"},{"value":"thinker","label":"Strategist — I plan the play 🧠","weight":0.9,"emoji":"🧠"},{"value":"cheerleader","label":"Motivator — I keep spirits high 🎉","weight":0.7,"emoji":"🎉"}]',
         1.5, 'leadership_score', 3, NULL, 'team'),

        ('community', 'skills', 'What superpower do you bring to a partnership?', 'multi_choice',
         '[{"value":"money","label":"Capital 💰","weight":1.0},{"value":"time","label":"Time & Effort ⏰","weight":0.9},{"value":"network","label":"Connections & Network 🌐","weight":0.85},{"value":"expertise","label":"Domain Knowledge 📚","weight":0.95},{"value":"marketing","label":"Marketing & Branding 📣","weight":0.8},{"value":"tech","label":"Technology & Tools 💻","weight":0.9},{"value":"operations","label":"Operations & Management 📋","weight":0.85}]',
         1.4, 'collaboration_score', 4, 'The best partnerships have complementary superpowers!', 'stars'),

        ('community', 'creative', 'Your dream partnership motto?', 'choice',
         '[{"value":"move_fast","label":"Move fast, break things 🚀","weight":0.8,"emoji":"🚀"},{"value":"slow_steady","label":"Slow and steady wins the race 🐢","weight":0.6,"emoji":"🐢"},{"value":"think_big","label":"Think big, think different 💡","weight":0.9,"emoji":"💡"},{"value":"people_first","label":"People first, profit follows ❤️","weight":0.75,"emoji":"❤️"},{"value":"data_driven","label":"Data doesn''t lie 📊","weight":0.85,"emoji":"📊"}]',
         1.0, 'risk_appetite', 5, NULL, 'rocket'),

        ('community', 'personality', 'How many hours/week can you commit to a project?', 'choice',
         '[{"value":"0_2","label":"1-2 hours (I''m busy but interested)","weight":0.3,"emoji":"⏱️"},{"value":"3_5","label":"3-5 hours (weekends warrior)","weight":0.5,"emoji":"🗓️"},{"value":"5_15","label":"5-15 hours (part-time commitment)","weight":0.8,"emoji":"⚡"},{"value":"15_plus","label":"15+ hours (let''s go all in!)","weight":1.0,"emoji":"🔥"}]',
         1.3, 'time_commitment', 6, 'Most successful community projects need at least 5-10 hours/week from core team members.', 'clock'),

        ('community', 'personality', 'How big is your local network?', 'choice',
         '[{"value":"tight","label":"Small but tight-knit circle","weight":0.4,"emoji":"👨‍👩‍👧‍👦"},{"value":"moderate","label":"Know a good bunch of people","weight":0.6,"emoji":"🤝"},{"value":"wide","label":"I''m pretty well-connected","weight":0.8,"emoji":"🌐"},{"value":"massive","label":"I know EVERYONE in my community","weight":1.0,"emoji":"🏙️"}]',
         1.1, 'network_strength', 7, 'The strongest communities start with just 12-15 passionate people.', 'globe'),

        ('community', 'financial', 'How much can you invest in a community project?', 'choice',
         '[{"value":"under_50k","label":"Under ₹50,000","weight":0.3,"emoji":"🌱"},{"value":"50k_2l","label":"₹50K – ₹2 Lakh","weight":0.5,"emoji":"🌿"},{"value":"2l_10l","label":"₹2L – ₹10 Lakh","weight":0.8,"emoji":"🌳"},{"value":"above_10l","label":"₹10 Lakh+","weight":1.0,"emoji":"🏔️"}]',
         1.2, 'investment_capacity', 8, NULL, 'piggybank'),

        -- OPPORTUNITY VAULT Questions
        ('opportunity', 'financial', 'What stage of startups excites you most?', 'choice',
         '[{"value":"pre_seed","label":"Pre-seed — ground zero 🌱","weight":1.0,"emoji":"🌱"},{"value":"seed","label":"Seed — proof of concept 🌿","weight":0.85,"emoji":"🌿"},{"value":"series_a","label":"Series A — scaling up 🚀","weight":0.7,"emoji":"🚀"},{"value":"growth","label":"Growth — proven winners 📈","weight":0.5,"emoji":"📈"}]',
         1.3, 'risk_appetite', 1, 'Pre-seed investments have the highest risk but also the highest potential returns!', 'seed'),

        ('opportunity', 'skills', 'Which industries do you understand deeply?', 'multi_choice',
         '[{"value":"tech","label":"Technology 💻","weight":0.9},{"value":"fintech","label":"Fintech 🏦","weight":0.9},{"value":"healthcare","label":"Healthcare 🏥","weight":0.85},{"value":"education","label":"EdTech 📚","weight":0.8},{"value":"consumer","label":"Consumer & D2C 🛍️","weight":0.8},{"value":"sustainability","label":"Climate & Sustainability 🌍","weight":0.85},{"value":"ai_ml","label":"AI & Deep Tech 🤖","weight":0.95},{"value":"logistics","label":"Logistics & Supply Chain 🚛","weight":0.75}]',
         1.4, 'domain_expertise', 2, NULL, 'industry'),

        ('opportunity', 'personality', 'How involved do you want to be with founders?', 'choice',
         '[{"value":"silent","label":"Silent investor — just returns","weight":0.3,"emoji":"🤫"},{"value":"advisory","label":"Help when asked — advisory","weight":0.6,"emoji":"💡"},{"value":"active","label":"Active mentor — regular calls","weight":0.85,"emoji":"📞"},{"value":"hands_on","label":"Hands-on partner — co-build","weight":1.0,"emoji":"🤝"}]',
         1.2, 'collaboration_score', 3, NULL, 'handshake'),

        ('opportunity', 'risk', 'What''s your risk comfort with startup investments?', 'choice',
         '[{"value":"low","label":"Low — only if well-backed","weight":0.3,"emoji":"🔒"},{"value":"moderate","label":"Moderate — willing to take calculated risks","weight":0.6,"emoji":"🎲"},{"value":"high","label":"High — comfortable with uncertainty","weight":0.85,"emoji":"🎢"},{"value":"yolo","label":"YOLO — this is the way","weight":1.0,"emoji":"🚀"}]',
         1.5, 'risk_appetite', 4, '90% of startups fail, but the 10% that succeed can return 100x.', 'dice')

        ON CONFLICT DO NOTHING;
    """)


def downgrade() -> None:
    op.drop_table("personality_dimensions")
    op.drop_table("profile_match_scores")
    op.drop_table("opportunity_application_answers")
    op.drop_table("opportunity_custom_questions")
    op.drop_table("user_profile_answers")
    op.drop_table("vault_profile_questions")
