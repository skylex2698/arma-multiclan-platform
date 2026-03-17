#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="$(basename "$ROOT_DIR")"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
OUTPUT_PATH="${1:-/tmp/${PROJECT_NAME}-${TIMESTAMP}.tar.gz}"

log() {
  printf '[create-transfer-tar] %s\n' "$1"
}

fail() {
  printf '[create-transfer-tar] ERROR: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "No se encontró el comando requerido: $1"
}

main() {
  require_command tar

  mkdir -p "$(dirname "$OUTPUT_PATH")"

  log "Generando paquete portable en $OUTPUT_PATH"

  tar \
    --exclude='.git' \
    --exclude='backend/node_modules' \
    --exclude='frontend/node_modules' \
    --exclude='backend/dist' \
    --exclude='frontend/dist' \
    --exclude='backend/coverage' \
    --exclude='frontend/coverage' \
    --exclude='backend/.vite' \
    --exclude='frontend/.vite' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    -czf "$OUTPUT_PATH" \
    -C "$(dirname "$ROOT_DIR")" \
    "$PROJECT_NAME"

  log "Paquete listo."
}

main "$@"
