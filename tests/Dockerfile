# ── WealthSpot Test Runner ─────────────────────────────────
# Opt-in container: only deployed with --profile test
# Usage: docker compose --profile test up test-runner
#
FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache python3 py3-pip

# Copy root workspace config
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY tests/ ./tests/

# Install JS test dependencies
RUN npm install --legacy-peer-deps --workspace=tests

# Install Python test dependencies
COPY tests/api/pyproject.toml /app/tests/api/
RUN pip3 install --no-cache-dir --break-system-packages \
    pytest pytest-asyncio pytest-cov httpx faker aiosqlite

# Source code is mounted as read-only volumes at runtime
# See docker-compose.yml test-runner service

CMD ["echo", "Test runner ready. Run: npm test --workspace=tests"]
