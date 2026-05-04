"""Encrypt PAN at rest.

Adds `users.pan_encrypted` (Text) and back-fills it from any plaintext
`pan_number` values using the application's Fernet key. The legacy
`pan_number` column is kept for one release so reads can fall back; a later
migration will drop it once all reads have moved over.

Revision ID: 052_encrypt_pan
Revises: 051_inv_txn_records
Create Date: 2026-04-27 12:00:00.000000
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa

from alembic import op

revision: str = "052_encrypt_pan"
down_revision: Union[str, None] = "051_inv_txn_records"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("pan_encrypted", sa.Text(), nullable=True))

    # Best-effort backfill: encrypt any existing plaintext PANs.
    # Skipped silently if ENCRYPTION_KEY is unavailable in the migration env;
    # in that case operators must run a one-off backfill script.
    try:
        from app.services.encryption import encrypt

        bind = op.get_bind()
        rows = bind.execute(
            sa.text(
                "SELECT id, pan_number FROM users "
                "WHERE pan_number IS NOT NULL AND pan_number <> ''"
            )
        ).fetchall()
        for row in rows:
            ciphertext = encrypt(row.pan_number)
            bind.execute(
                sa.text("UPDATE users SET pan_encrypted = :ct WHERE id = :uid"),
                {"ct": ciphertext, "uid": row.id},
            )
    except Exception:
        # Operators can run scripts/backfill_pan_encryption.py later.
        pass


def downgrade() -> None:
    op.drop_column("users", "pan_encrypted")
