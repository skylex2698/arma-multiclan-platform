#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
ENV_EXAMPLE_FILE="$ROOT_DIR/.env.example"

log() {
  printf '[first-up] %s\n' "$1"
}

fail() {
  printf '[first-up] ERROR: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "No se encontró el comando requerido: $1"
}

ensure_env_file() {
  if [[ -f "$ENV_FILE" ]]; then
    log ".env ya existe. Se reutiliza la configuración actual."
    return
  fi

  [[ -f "$ENV_EXAMPLE_FILE" ]] || fail "No existe $ENV_EXAMPLE_FILE"

  cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
  log "Se creó .env a partir de .env.example."

  if grep -q '^JWT_SECRET=CAMBIA_ESTO_' "$ENV_FILE"; then
    local generated_secret
    generated_secret="$(openssl rand -base64 32 | tr -d '\n')"
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$generated_secret|" "$ENV_FILE"
    log "Se generó automáticamente un JWT_SECRET seguro."
  fi
}

cleanup_local_artifacts() {
  log "Limpiando artefactos locales prescindibles..."
  rm -rf \
    "$ROOT_DIR/backend/node_modules" \
    "$ROOT_DIR/frontend/node_modules" \
    "$ROOT_DIR/backend/dist" \
    "$ROOT_DIR/frontend/dist"
}

check_docker() {
  docker info >/dev/null 2>&1 || fail "Docker no está accesible o el daemon no está levantado"
  docker compose version >/dev/null 2>&1 || fail "docker compose no está disponible"
}

start_stack() {
  log "Levantando contenedores con docker compose up --build -d ..."
  (
    cd "$ROOT_DIR"
    docker compose up --build -d
  )
}

prune_dangling_images() {
  log "Eliminando imágenes colgantes generadas durante el build..."
  docker image prune -f >/dev/null 2>&1 || true
}

show_status() {
  log "Estado final del stack:"
  (
    cd "$ROOT_DIR"
    docker compose ps
  )
}

main() {
  require_command docker
  require_command openssl
  require_command sed

  check_docker
  ensure_env_file
  cleanup_local_artifacts
  start_stack
  prune_dangling_images
  show_status

  log "Primer arranque completado."
}

main "$@"
