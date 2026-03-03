#!/usr/bin/env bash
set -euo pipefail

# Phase 1 baseline smoke checks.
# Verifies core HTTP surfaces are reachable and no key route returns 404.
#
# Usage:
#   ./scripts/smoke.sh
#   SKIP_MAILHOG=1 ./scripts/smoke.sh   # Skip MailHog (e.g. local dev without Docker)
#   SMOKE_WAIT=60 ./scripts/smoke.sh   # Wait up to 60s for services before checks (default: 0)

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
API_URL="${API_URL:-http://localhost:8080}"
MAILHOG_URL="${MAILHOG_URL:-http://localhost:8025}"
SMOKE_WAIT="${SMOKE_WAIT:-0}"

PASS_COUNT=0
FAIL_COUNT=0

# Wait for URL to return 200, retry every 2s up to max_secs
wait_for_url() {
  local url="$1"
  local name="$2"
  local max_secs="${3:-30}"
  local elapsed=0
  while [ "$elapsed" -lt "$max_secs" ]; do
    local code
    code="$(curl -sS -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")"
    if [[ "$code" == "200" ]]; then
      return 0
    fi
    sleep 2
    elapsed=$((elapsed + 2))
  done
  return 1
}

print_check() {
  printf "\n==> %s\n" "$1"
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf "  [PASS] %s\n" "$1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf "  [FAIL] %s\n" "$1"
}

status_code() {
  local url="$1"
  curl -sS -o /dev/null -w "%{http_code}" "$url" || true
}

check_web_route() {
  local url="$1"
  local name="$2"
  local code
  code="$(status_code "$url")"

  # Accept normal page responses and redirects.
  # Allow 401/403 for protected routes when auth is missing.
  case "$code" in
    200|301|302|307|308|401|403)
      pass "$name ($url) returned $code"
      ;;
    *)
      fail "$name ($url) returned $code (unexpected)"
      ;;
  esac
}

check_exact_200() {
  local url="$1"
  local name="$2"
  local code
  code="$(status_code "$url")"

  if [[ "$code" == "200" ]]; then
    pass "$name ($url) returned 200"
  else
    fail "$name ($url) returned $code (expected 200)"
  fi
}

# Optional: wait for services to be ready (useful after docker compose up)
if [[ "${SMOKE_WAIT}" -gt 0 ]]; then
  printf "\n==> Waiting up to %ss for services...\n" "$SMOKE_WAIT"
  if wait_for_url "$API_URL/api/health" "API" "$SMOKE_WAIT"; then
    printf "  Backend ready.\n"
  else
    fail "Backend not ready within ${SMOKE_WAIT}s"
  fi
  if wait_for_url "$FRONTEND_URL/" "Frontend" "$SMOKE_WAIT"; then
    printf "  Frontend ready.\n"
  else
    fail "Frontend not ready within ${SMOKE_WAIT}s"
  fi
fi

print_check "Backend health"
check_exact_200 "$API_URL/api/health" "API health endpoint"

print_check "Frontend core routes (must not 404)"
check_web_route "$FRONTEND_URL/" "Home"
check_web_route "$FRONTEND_URL/login" "Login"
check_web_route "$FRONTEND_URL/register" "Register"
check_web_route "$FRONTEND_URL/verify-email" "Verify email"
check_web_route "$FRONTEND_URL/runway" "Runway"
check_web_route "$FRONTEND_URL/matcha" "Matcha"
check_web_route "$FRONTEND_URL/discover" "Discover"
check_web_route "$FRONTEND_URL/search" "Search"

if [[ "${SKIP_MAILHOG:-0}" != "1" ]]; then
  print_check "MailHog"
  check_exact_200 "$MAILHOG_URL" "MailHog UI"
else
  printf "\n==> Skipping MailHog (SKIP_MAILHOG=1)\n"
fi

printf "\n==============================\n"
printf "Smoke result: %d passed, %d failed\n" "$PASS_COUNT" "$FAIL_COUNT"
printf "==============================\n"

if [[ "$FAIL_COUNT" -gt 0 ]]; then
  exit 1
fi
