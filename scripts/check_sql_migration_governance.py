#!/usr/bin/env python3
"""Validate governance rules for standalone SQL migration files.

Rules enforced:
1) Filename must follow: NNN[_suffix]_description.sql where NNN is 3 digits.
2) For the same numeric prefix, there can only be one unsuffixed file.
3) A suffix (like 005b) must be unique within the same numeric prefix.

This script is read-only and exits non-zero on violations.
"""

from __future__ import annotations

import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_DIR = ROOT / "services" / "api" / "database"
MIGRATION_RE = re.compile(r"^(?P<num>\d{3})(?P<suffix>[a-z]?)_(?P<name>[a-z0-9_]+)\.sql$")


@dataclass(frozen=True)
class MigrationName:
    file_name: str
    num: str
    suffix: str



def collect_sql_files() -> list[Path]:
    if not DB_DIR.exists():
        print(f"ERROR: database directory not found: {DB_DIR}")
        sys.exit(2)
    return sorted(path for path in DB_DIR.glob("*.sql") if path.is_file())



def parse_migration_names(files: list[Path]) -> tuple[list[MigrationName], list[str]]:
    parsed: list[MigrationName] = []
    invalid: list[str] = []

    for path in files:
        match = MIGRATION_RE.match(path.name)
        if not match:
            invalid.append(path.name)
            continue
        parsed.append(
            MigrationName(
                file_name=path.name,
                num=match.group("num"),
                suffix=match.group("suffix"),
            )
        )

    return parsed, invalid



def find_collisions(parsed: list[MigrationName]) -> list[str]:
    grouped: dict[str, list[MigrationName]] = defaultdict(list)
    for item in parsed:
        grouped[item.num].append(item)

    errors: list[str] = []
    for num, entries in sorted(grouped.items()):
        no_suffix = [e for e in entries if e.suffix == ""]
        if len(no_suffix) > 1:
            joined = ", ".join(e.file_name for e in no_suffix)
            errors.append(
                f"duplicate base migration number {num}: {joined}"
            )

        suffix_count: dict[str, int] = defaultdict(int)
        for entry in entries:
            if entry.suffix:
                suffix_count[entry.suffix] += 1

        repeated_suffixes = sorted(k for k, v in suffix_count.items() if v > 1)
        for suffix in repeated_suffixes:
            joined = ", ".join(e.file_name for e in entries if e.suffix == suffix)
            errors.append(
                f"duplicate suffix {num}{suffix}: {joined}"
            )

    return errors



def main() -> int:
    files = collect_sql_files()
    parsed, invalid = parse_migration_names(files)
    collisions = find_collisions(parsed)

    if invalid or collisions:
        print("SQL migration governance check failed.")
        if invalid:
            print("- Invalid migration filename pattern:")
            for name in invalid:
                print(f"  - {name}")
            print("  Expected: NNN[_optional-lowercase-suffix]_snake_case_description.sql")

        if collisions:
            print("- Versioning collisions:")
            for issue in collisions:
                print(f"  - {issue}")

        return 1

    print(f"SQL migration governance check passed ({len(parsed)} files).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
