#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Running Alembic migrations..."
  if [ "${DRY_RUN:-false}" = "true" ]; then
    alembic upgrade head --sql
  else
    alembic upgrade head
  fi
  echo "Migrations complete."
  exit 0
fi

exec "$@"
