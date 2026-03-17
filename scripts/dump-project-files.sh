#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

find . \
  \( \
    -path './.git' -o \
    -path './backend/node_modules' -o \
    -path './frontend/node_modules' -o \
    -path './backend/dist' -o \
    -path './frontend/dist' -o \
    -path './backend/coverage' -o \
    -path './frontend/coverage' -o \
    -path './backend/.vite' -o \
    -path './frontend/.vite' \
  \) -prune -o \
  -type f \
  ! -name '*.log' \
  ! -name '.DS_Store' \
  -print0 |
while IFS= read -r -d '' file; do
  if grep -Iq . "$file" 2>/dev/null; then
    echo "# inicio de archivo $file"
    cat "$file"
    echo
    echo "# fin de archivo $file"
    echo
  fi
done
