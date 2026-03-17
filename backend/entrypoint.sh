#!/bin/sh
set -e

echo "============================================"
echo "Arma Multiclan Platform - Backend Startup"
echo "============================================"
echo "Environment: ${NODE_ENV:-development}"
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

echo ""
echo "[1/4] Waiting for database connection..."

MAX_RETRIES=30
RETRY_INTERVAL=2
RETRY_COUNT=0
PRISMA_SCHEMA_PATH="/app/prisma/schema.prisma"
UPLOADS_DIR="/app/public/uploads"
PRISMA_BIN="/app/node_modules/.bin/prisma"
APP_USER="node"

run_as_app() {
  if [ "$(id -u)" -eq 0 ]; then
    runuser -u "$APP_USER" -- sh -lc "$1"
  else
    sh -lc "$1"
  fi
}

mkdir -p "$UPLOADS_DIR/clans" "$UPLOADS_DIR/events"
if [ "$(id -u)" -eq 0 ]; then
  chown -R "$APP_USER:$APP_USER" "$UPLOADS_DIR"
fi
chmod -R u+rwX,g+rwX "$UPLOADS_DIR"

until run_as_app "printf 'SELECT 1;\n' | \"$PRISMA_BIN\" db execute --stdin --schema \"$PRISMA_SCHEMA_PATH\" > /dev/null 2>&1"; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: Database not reachable after ${MAX_RETRIES} attempts ($(($MAX_RETRIES * $RETRY_INTERVAL))s). Exiting."
    exit 1
  fi
  echo "  Retrying in ${RETRY_INTERVAL}s... (${RETRY_COUNT}/${MAX_RETRIES})"
  sleep "$RETRY_INTERVAL"
done

echo "  Database connection established."

echo ""
echo "[2/4] Running Prisma migrations..."

if ! find /app/prisma/migrations -mindepth 1 -maxdepth 1 -type d | grep -q . 2>/dev/null; then
  echo "ERROR: No Prisma migrations found in /app/prisma/migrations."
  echo "Commit versioned migrations before deploying this project."
  exit 1
fi

if run_as_app "\"$PRISMA_BIN\" migrate deploy --schema \"$PRISMA_SCHEMA_PATH\" 2>&1"; then
  echo "  Migrations completed successfully."
else
  MIGRATE_EXIT=$?
  echo "ERROR: Prisma migrate deploy failed with exit code ${MIGRATE_EXIT}. Exiting."
  exit $MIGRATE_EXIT
fi

echo ""
echo "[3/4] Initializing default admin user (if needed)..."

run_as_app "node dist/scripts/init-admin.js"

echo "  Admin initialization completed."

echo ""
echo "[4/4] Starting application..."
echo "============================================"
echo ""

if [ "$(id -u)" -eq 0 ]; then
  exec runuser -u "$APP_USER" -- node dist/index.js
fi

exec node dist/index.js
