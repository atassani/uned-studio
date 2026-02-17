#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cleanup() {
  if [ -n "${DATA_PID:-}" ] && kill -0 "$DATA_PID" 2>/dev/null; then
    kill "$DATA_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

cd "$ROOT_DIR"
npm run dev:data --workspace=frontend &
DATA_PID=$!

exec npm run dev --workspace=frontend
