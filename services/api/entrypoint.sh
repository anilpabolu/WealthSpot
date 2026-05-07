#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Running Alembic migrations..."
  alembic upgrade head
  echo "Migrations complete."
else
  echo "Skipping migrations (RUN_MIGRATIONS != true)."
fi

exec "$@"
