#!/usr/bin/env python3
"""Run a staged database replay readiness flow.

This script orchestrates:
1) SQL migration governance check
2) Phase-1 precheck SQL report (optional, requires psql + database URL)
3) Alembic status checks (optional)
4) Smoke hook command (optional)

The goal is deterministic execution in CI/staging before production rollout.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parent.parent
PRECHECK_SQL = ROOT / "services" / "api" / "database" / "prechecks" / "phase1_constraint_precheck.sql"
API_DIR = ROOT / "services" / "api"
GOVERNANCE_CHECKER = ROOT / "scripts" / "check_sql_migration_governance.py"


def resolve_command(binary: str) -> str:
    """Resolve executable name with Windows-friendly fallback."""
    if os.name == "nt" and binary == "npm":
        npm_cmd = shutil.which("npm.cmd")
        if npm_cmd:
            return npm_cmd

    resolved = shutil.which(binary)
    return resolved or binary


DB_URL_SCHEMES = ("postgresql://", "postgres://", "postgresql+asyncpg://", "postgres+asyncpg://")


def redact_arg(value: str) -> str:
    lowered = value.lower()
    if lowered.startswith(DB_URL_SCHEMES):
        return "<DATABASE_URL>"
    if re.search(r"token|secret|password|passwd|key", lowered):
        return "<REDACTED>"
    return value


def normalize_database_url_for_psql(database_url: str) -> str:
    url = database_url.strip()
    if url.startswith("postgresql+asyncpg://"):
        url = "postgresql://" + url[len("postgresql+asyncpg://") :]
    if url.startswith("postgres+asyncpg://"):
        url = "postgres://" + url[len("postgres+asyncpg://") :]

    parsed = urlsplit(url)
    query_items = parse_qsl(parsed.query, keep_blank_values=True)
    rewritten: list[tuple[str, str]] = []
    for key, value in query_items:
        if key == "ssl":
            rewritten.append(("sslmode", "require" if value in {"1", "true", "require"} else value))
        else:
            rewritten.append((key, value))

    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(rewritten), parsed.fragment))


def sanitize_database_url(database_url: str) -> str:
    parsed = urlsplit(database_url)
    if not parsed.netloc:
        return "<DATABASE_URL>"

    host_port = parsed.hostname or ""
    if parsed.port:
        host_port = f"{host_port}:{parsed.port}"

    auth = parsed.username or ""
    if parsed.password:
        auth = f"{auth}:***"

    netloc = f"{auth}@{host_port}" if auth else host_port
    return urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment))


def run_command(label: str, command: list[str], cwd: Path | None = None) -> None:
    print(f"\n=== {label} ===")
    print("$", " ".join(redact_arg(arg) for arg in command))
    try:
        subprocess.run(command, cwd=str(cwd) if cwd else None, check=True)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"{label} failed with exit code {exc.returncode}") from None


def run_governance_check() -> None:
    if GOVERNANCE_CHECKER.exists():
        run_command(
            "SQL migration governance",
            [sys.executable, str(GOVERNANCE_CHECKER)],
            cwd=ROOT,
        )
        return

    npm = resolve_command("npm")
    run_command("SQL migration governance", [npm, "run", "db:check:sql-migrations"], cwd=ROOT)


def run_precheck_sql(database_url: str) -> None:
    if not PRECHECK_SQL.exists():
        raise FileNotFoundError(f"Precheck SQL file missing: {PRECHECK_SQL}")

    psql = shutil.which("psql")
    if not psql:
        raise RuntimeError("psql not found in PATH. Install PostgreSQL client tools or use --skip-psql-precheck")

    psql_url = normalize_database_url_for_psql(database_url)
    print("Using psql URL:", sanitize_database_url(psql_url))

    run_command(
        "Phase-1 constraint precheck SQL",
        [psql, psql_url, "-v", "ON_ERROR_STOP=1", "-f", str(PRECHECK_SQL)],
        cwd=ROOT,
    )


def run_alembic_status(api_dir: Path) -> None:
    if not (api_dir / "alembic.ini").exists():
        raise FileNotFoundError(f"alembic.ini not found under {api_dir}")

    run_command("Alembic current", ["alembic", "current"], cwd=api_dir)
    run_command("Alembic pending history", ["alembic", "history", "-r", "current:head"], cwd=api_dir)


def run_smoke_hook(smoke_command: str) -> None:
    print("\n=== Smoke hook ===")
    print("$", smoke_command)
    command_text = smoke_command.strip()
    if os.name == "nt" and command_text.startswith("bash ") and not shutil.which("bash"):
        raise RuntimeError(
            "Smoke command requires bash, but bash is not available on this host. "
            "Use Git Bash/WSL or provide a PowerShell-compatible --smoke-command."
        )

    try:
        subprocess.run(smoke_command, cwd=str(ROOT), shell=True, check=True)
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(f"Smoke hook failed with exit code {exc.returncode}") from None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run DB replay readiness checks")
    parser.add_argument(
        "--database-url",
        default=os.environ.get("DATABASE_URL", ""),
        help="Database URL for psql precheck (defaults to DATABASE_URL env var)",
    )
    parser.add_argument(
        "--skip-psql-precheck",
        action="store_true",
        help="Skip running phase1_constraint_precheck.sql",
    )
    parser.add_argument(
        "--skip-alembic",
        action="store_true",
        help="Skip Alembic current/pending checks",
    )
    parser.add_argument(
        "--smoke-command",
        default="",
        help="Optional smoke command to run after DB checks, e.g. 'bash deployment/scripts/04-validate.sh'",
    )
    parser.add_argument(
        "--api-dir",
        default=str(API_DIR),
        help="Path to services/api directory containing alembic.ini",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        run_governance_check()

        if not args.skip_psql_precheck:
            if not args.database_url:
                print(
                    "ERROR: DATABASE_URL is required for precheck SQL. "
                    "Provide --database-url or use --skip-psql-precheck.",
                    file=sys.stderr,
                )
                return 2
            run_precheck_sql(args.database_url)
        else:
            print("\n=== Phase-1 constraint precheck SQL ===")
            print("Skipped (--skip-psql-precheck)")

        if not args.skip_alembic:
            run_alembic_status(Path(args.api_dir))
        else:
            print("\n=== Alembic checks ===")
            print("Skipped (--skip-alembic)")

        if args.smoke_command.strip():
            run_smoke_hook(args.smoke_command)
        else:
            print("\n=== Smoke hook ===")
            print("Skipped (no --smoke-command provided)")

        print("\nDB replay readiness flow completed.")
        return 0
    except (FileNotFoundError, RuntimeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
