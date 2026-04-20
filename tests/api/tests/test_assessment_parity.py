"""
Parity guard — the TypeScript assessments catalogue at
packages/wealthspot-types/src/assessments.ts must stay in lock-step with
the Python mirror in app/core/assessments.py.

We parse the TS file with a small regex-based scanner (not a full TS parser)
because the file is deliberately kept as a plain, declarative constant — no
expressions, no imports, no templating. A mismatch fails CI and the person
touching either side is forced to update both.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from app.core.assessments import ASSESSMENT_CATEGORIES


ROOT = Path(__file__).resolve().parents[3]
TS_FILE = ROOT / "packages" / "wealthspot-types" / "src" / "assessments.ts"


def _parse_ts_catalogue() -> dict[str, list[str]]:
    """Return {category_code: [sub_codes...]} parsed from the TS file."""
    text = TS_FILE.read_text(encoding="utf-8")
    # Each category block starts with `code: "xxx",` at the category level.
    # Within that block, each sub-item also has its own `code: "yyy",`.
    # Strategy: find the `ASSESSMENT_CATEGORIES` literal and walk it.
    start = text.index("ASSESSMENT_CATEGORIES")
    body = text[start:]

    # Find all code declarations in order, preserving nesting by tracking depth.
    # Each `{` that follows a `code:` line pattern is a new object.
    # Simpler approach: split on top-level category blocks by indentation-aware
    # scanning. But the file is hand-written with 2-space indentation, so we
    # can detect categories (leading spaces before `code:` == 4) and sub-items
    # (leading spaces before `code:` == 8).
    result: dict[str, list[str]] = {}
    current: str | None = None
    for line in body.splitlines():
        m = re.match(r"^(\s*)code:\s*\"([^\"]+)\"", line)
        if not m:
            continue
        indent = len(m.group(1))
        value = m.group(2)
        if indent == 4:
            current = value
            result[current] = []
        elif indent == 8 and current is not None:
            result[current].append(value)
    return result


def _py_catalogue() -> dict[str, list[str]]:
    return {
        cat.code: [sub.code for sub in cat.sub_items]
        for cat in ASSESSMENT_CATEGORIES
    }


def test_ts_file_exists():
    assert TS_FILE.exists(), f"TS file not found at {TS_FILE}"


def test_category_codes_match():
    ts = _parse_ts_catalogue()
    py = _py_catalogue()
    assert set(ts.keys()) == set(py.keys()), (
        f"Category drift — TS: {sorted(ts.keys())} vs Py: {sorted(py.keys())}"
    )


def test_category_order_matches():
    """The order matters — it drives the hero strip left-to-right."""
    ts = list(_parse_ts_catalogue().keys())
    py = list(_py_catalogue().keys())
    assert ts == py, f"Category order drift — TS: {ts} vs Py: {py}"


@pytest.mark.parametrize(
    "cat_code",
    [c.code for c in ASSESSMENT_CATEGORIES],
)
def test_subitem_codes_match(cat_code: str):
    ts = _parse_ts_catalogue()
    py = _py_catalogue()
    assert ts[cat_code] == py[cat_code], (
        f"Sub-item drift in {cat_code} — "
        f"TS: {ts[cat_code]} vs Py: {py[cat_code]}"
    )
