#!/usr/bin/env bash
# /scripts/verify.sh
set -euo pipefail

MODE="${VERIFY_MODE:-local}" # local|ci

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERIFY_LINT="${VERIFY_LINT:-1}"
VERIFY_TYPECHECK="${VERIFY_TYPECHECK:-1}"
VERIFY_TEST="${VERIFY_TEST:-1}"
VERIFY_BUILD="${VERIFY_BUILD:-0}"

say() { printf '%s\n' "$*"; }

run_step() {
  local name="$1"; shift
  say ""
  say "==> ${name}"
  "$@"
}

meta() {
  say "czz.verify"
  say "  mode=${MODE}"
  say "  ts_utc=$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    say "  sha=$(git rev-parse --short HEAD || true)"
    say "  branch=$(git rev-parse --abbrev-ref HEAD || true)"
    local dirty
    dirty="$(git status --porcelain | wc -l | tr -d ' ')"
    say "  dirty=${dirty}"
  fi
  if command -v node >/dev/null 2>&1; then say "  node=$(node -v)"; fi
  if command -v pnpm >/dev/null 2>&1; then say "  pnpm=$(pnpm -v)"; fi
  if command -v uname >/dev/null 2>&1; then say "  os=$(uname -a)"; fi
}

meta

if [[ "${VERIFY_LINT}" == "1" ]]; then
  if [[ "${MODE}" == "ci" ]]; then
    # CIでは biome ci を推奨（read-only / 自動修正なし）
    run_step "lint/format/imports (CI): biome ci ." pnpm exec biome ci . --colors=off
  else
    run_step "lint/format/imports: pnpm check" pnpm -s run check
  fi
fi

if [[ "${VERIFY_TYPECHECK}" == "1" ]]; then
  run_step "typecheck: pnpm typecheck" pnpm -s run typecheck
fi

if [[ "${VERIFY_TEST}" == "1" ]]; then
  if [[ "${MODE}" == "ci" ]]; then
    # watch を避け、色も抑える
    run_step "test (CI): vitest --run" pnpm -s run test -- --run --reporter=basic --no-color
  else
    run_step "test: vitest" pnpm -s run test
  fi
fi

if [[ "${VERIFY_BUILD}" == "1" ]]; then
  run_step "build: pnpm build" pnpm -s run build
fi

say ""
say "OK: verify passed"
