#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://humblyproud.com}"
BASE_URL="${BASE_URL%/}"

STUDIO_BASE="${BASE_URL}/studio"

function check_status() {
  local url="$1"
  local expected="$2"
  local actual
  actual="$(curl -sS -o /dev/null -w "%{http_code}" "$url")"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL $url expected=$expected actual=$actual"
    return 1
  fi
  echo "OK   $url status=$actual"
}

echo "Language-route deploy smoke checks"
echo "Target: $BASE_URL"
echo

check_status "${STUDIO_BASE}/" "200"
check_status "${STUDIO_BASE}/en" "200"
check_status "${STUDIO_BASE}/fr" "404"

echo
echo "HTTP smoke checks passed."
echo "Manual follow-up still required: Google/Guest login, progress fallback, and logout/login regression."
