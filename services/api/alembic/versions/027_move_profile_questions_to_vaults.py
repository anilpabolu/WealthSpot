"""Move profile questions to vault profiling

Adds 3 new Wealth Vault questions (annual income, monthly capacity, experience)
and 2 new Community Vault questions (skills, contribution interests) that were
previously asked during profile completion. Existing questions are shifted down.

Revision ID: 027_move_profile_q
Revises: 026_community_subtypes
Create Date: 2025-06-03
"""

from alembic import op

revision = "027_move_profile_q"
down_revision = "026_community_subtypes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # Shift existing wealth questions sort_order by +3 (making room for 3 new ones at top)
    conn.exec_driver_sql("""
        UPDATE vault_profile_questions
        SET sort_order = sort_order + 3
        WHERE vault_type = 'wealth' AND is_active = true;
    """)

    # Shift existing community questions sort_order by +2 (making room for 2 new ones at top)
    conn.exec_driver_sql("""
        UPDATE vault_profile_questions
        SET sort_order = sort_order + 2
        WHERE vault_type = 'community' AND is_active = true;
    """)

    # Insert 3 new Wealth Vault questions at the top
    conn.exec_driver_sql("""
        INSERT INTO vault_profile_questions
            (vault_type, category, question_text, question_type, options, weight, dimension, sort_order, is_required, fun_fact, illustration)
        VALUES
        (
            'wealth', 'financial',
            'What''s your annual income range?',
            'choice',
            '[{"value":"below_5l","label":"Below ₹5 Lakh","weight":0.3,"emoji":"🌱"},{"value":"5l_10l","label":"₹5L – ₹10 Lakh","weight":0.5,"emoji":"💰"},{"value":"10l_25l","label":"₹10L – ₹25 Lakh","weight":0.7,"emoji":"💎"},{"value":"25l_50l","label":"₹25L – ₹50 Lakh","weight":0.85,"emoji":"💎"},{"value":"50l_1cr","label":"₹50L – ₹1 Crore","weight":0.95,"emoji":"🏆"},{"value":"above_1cr","label":"Above ₹1 Crore","weight":1.0,"emoji":"👑"}]',
            1.3, 'investment_capacity', 1, true,
            'Understanding your income helps us recommend investments that fit your financial reality.',
            'coins'
        ),
        (
            'wealth', 'financial',
            'How much can you invest each month?',
            'choice',
            '[{"value":"5k_10k","label":"₹5K – ₹10K","weight":0.3,"emoji":"💵"},{"value":"10k_25k","label":"₹10K – ₹25K","weight":0.5,"emoji":"💵"},{"value":"25k_50k","label":"₹25K – ₹50K","weight":0.7,"emoji":"💰"},{"value":"50k_1l","label":"₹50K – ₹1 Lakh","weight":0.85,"emoji":"💰"},{"value":"above_1l","label":"Above ₹1 Lakh","weight":1.0,"emoji":"💎"}]',
            1.2, 'investment_capacity', 2, true,
            'Consistent monthly investments (SIP-style) historically outperform lump-sum investing.',
            'piggybank'
        ),
        (
            'wealth', 'skills',
            'How would you describe your investment experience?',
            'choice',
            '[{"value":"beginner","label":"Complete beginner — just getting started","weight":0.2,"emoji":"🌱"},{"value":"basic","label":"Know the basics — FDs, MFs","weight":0.5,"emoji":"📚"},{"value":"intermediate","label":"Intermediate — stocks, real estate","weight":0.8,"emoji":"📈"},{"value":"advanced","label":"Advanced — multi-asset portfolios","weight":1.0,"emoji":"🎯"}]',
            1.0, 'domain_expertise', 3, true,
            'Even Warren Buffett started as a beginner — what matters is the journey!',
            'book'
        )
        ON CONFLICT DO NOTHING;
    """)

    # Insert 2 new Community Vault questions at the top
    conn.exec_driver_sql("""
        INSERT INTO vault_profile_questions
            (vault_type, category, question_text, question_type, options, weight, dimension, sort_order, is_required, fun_fact, illustration)
        VALUES
        (
            'community', 'skills',
            'What skills do you bring to the table?',
            'multi_choice',
            '[{"value":"marketing","label":"Marketing 📣","weight":0.8},{"value":"finance","label":"Finance 💹","weight":0.9},{"value":"legal","label":"Legal ⚖️","weight":0.85},{"value":"tech","label":"Technology 💻","weight":0.9},{"value":"networking","label":"Networking 🤝","weight":0.8},{"value":"real_estate","label":"Real Estate 🏗️","weight":0.85},{"value":"design","label":"Design 🎨","weight":0.75},{"value":"sales","label":"Sales 📈","weight":0.8},{"value":"content","label":"Content Writing ✍️","weight":0.75}]',
            1.3, 'domain_expertise', 1, true,
            'The most successful community projects combine at least 3 different skill sets.',
            'tools'
        ),
        (
            'community', 'personality',
            'What kind of community work interests you?',
            'multi_choice',
            '[{"value":"mentoring","label":"Mentoring Others 🎓","weight":0.9},{"value":"reviewing","label":"Reviewing Deals 🔍","weight":0.85},{"value":"referrals","label":"Referring Investors 🤝","weight":0.8},{"value":"content","label":"Creating Content ✍️","weight":0.75},{"value":"events","label":"Organizing Events 🎉","weight":0.8}]',
            1.2, 'collaboration_score', 2, true,
            'Community builders who contribute in multiple ways have 3x more connections!',
            'team'
        )
        ON CONFLICT DO NOTHING;
    """)


def downgrade() -> None:
    conn = op.get_bind()

    # Remove the 5 newly inserted questions
    conn.exec_driver_sql("""
        DELETE FROM vault_profile_questions
        WHERE question_text IN (
            'What''s your annual income range?',
            'How much can you invest each month?',
            'How would you describe your investment experience?',
            'What skills do you bring to the table?',
            'What kind of community work interests you?'
        );
    """)

    # Shift wealth questions back
    conn.exec_driver_sql("""
        UPDATE vault_profile_questions
        SET sort_order = sort_order - 3
        WHERE vault_type = 'wealth' AND is_active = true;
    """)

    # Shift community questions back
    conn.exec_driver_sql("""
        UPDATE vault_profile_questions
        SET sort_order = sort_order - 2
        WHERE vault_type = 'community' AND is_active = true;
    """)
