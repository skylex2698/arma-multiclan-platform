#!/bin/sh
set -e

echo "============================================"
echo "Arma Multiclan Platform - Backend Startup"
echo "============================================"
echo "Environment: ${NODE_ENV:-development}"
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

# ─────────────────────────────────────────────
# Step 1: Wait for database connection
# ─────────────────────────────────────────────
echo ""
echo "[1/4] Waiting for database connection..."

MAX_RETRIES=30
RETRY_INTERVAL=2
RETRY_COUNT=0

until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: Database not reachable after ${MAX_RETRIES} attempts ($(($MAX_RETRIES * $RETRY_INTERVAL))s). Exiting."
    exit 1
  fi
  echo "  Retrying in ${RETRY_INTERVAL}s... (${RETRY_COUNT}/${MAX_RETRIES})"
  sleep "$RETRY_INTERVAL"
done

echo "  Database connection established."

# ─────────────────────────────────────────────
# Step 2: Run Prisma migrations
# ─────────────────────────────────────────────
echo ""
echo "[2/4] Running Prisma migrations..."

if npx prisma migrate deploy 2>&1; then
  echo "  Migrations completed successfully."
else
  MIGRATE_EXIT=$?
  echo "ERROR: Prisma migrate deploy failed with exit code ${MIGRATE_EXIT}. Exiting."
  exit $MIGRATE_EXIT
fi

# ─────────────────────────────────────────────
# Step 3: Initialize default admin user
# ─────────────────────────────────────────────
echo ""
echo "[3/4] Initializing default admin user (if needed)..."

node dist/scripts/init-admin.js

echo "  Admin initialization completed."

# ─────────────────────────────────────────────
# Step 4: Start the application
# ─────────────────────────────────────────────
echo ""
echo "[4/4] Starting application..."
echo "============================================"
echo ""

exec node dist/index.js