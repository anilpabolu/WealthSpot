"""Utility for executing multi-statement .sql files with asyncpg-compatible Alembic."""

import re
from pathlib import Path

from alembic import op
from sqlalchemy import text


def exec_sql_file(path: Path) -> None:
    """Execute a .sql file statement-by-statement (asyncpg compat).

    Handles $$ (dollar-quoted) blocks used in DO blocks and CREATE FUNCTION
    definitions, where semicolons inside the block must not be treated as
    statement separators.
    """
    sql = path.read_text(encoding="utf-8")
    # Split on semicolons that are NOT inside $$...$$ blocks
    statements = _split_sql(sql)
    for stmt in statements:
        stmt = stmt.strip()
        if stmt:
            op.execute(text(stmt))


def _split_sql(sql: str) -> list[str]:
    """Split SQL on top-level semicolons, respecting $$ quoting."""
    parts: list[str] = []
    current: list[str] = []
    in_dollar_quote = False
    # Tokenize by $$ boundaries
    tokens = re.split(r'(\$\$)', sql)
    for token in tokens:
        if token == '$$':
            in_dollar_quote = not in_dollar_quote
            current.append(token)
        elif in_dollar_quote:
            current.append(token)
        else:
            # Outside $$ — split on semicolons
            segments = token.split(';')
            for i, seg in enumerate(segments):
                current.append(seg)
                if i < len(segments) - 1:
                    # semicolon boundary
                    parts.append(''.join(current))
                    current = []
    if current:
        parts.append(''.join(current))
    return parts
