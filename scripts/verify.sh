#!/usr/bin/env bash
# scripts/verify.sh
# Purpose: run quality gates in a fixed order
#   1) biome check (via pnpm check)
#   2) typecheck (best-effort; require via REQUIRE_TYPECHECK=1)
#   3) vitest (via pnpm test)
#   4) optional build (via pnpm build if VERIFY_BUILD=1)

set -euo pipefail

mode="${1:-local}"
case "$mode" in
  local|ci) ;;
  *)
    echo "ERROR: mode must be 'local' or 'ci' (got: $mode)" >&2
    exit 2
    ;;
esac

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "$repo_root" ]]; then
  repo_root="$(cd "$script_dir/.." && pwd)"
fi
cd "$repo_root"

if [[ "$mode" == "ci" ]]; then
  export CI="${CI:-1}"
  export NO_COLOR="${NO_COLOR:-1}"
  export FORCE_COLOR="${FORCE_COLOR:-0}"
  export TERM="${TERM:-dumb}"
  export NPM_CONFIG_COLOR="${NPM_CONFIG_COLOR:-never}"
fi

verify_build="${VERIFY_BUILD:-0}"
require_typecheck="${REQUIRE_TYPECHECK:-0}"

ts_utc="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
ts_local="$(date +%Y-%m-%dT%H:%M:%S%z)"
sha_full="$(git rev-parse HEAD 2>/dev/null || echo 'nogit')"
sha_short="$(git rev-parse --short=12 HEAD 2>/dev/null || echo 'nogit')"
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'nogit')"
dirty="clean"
if git status --porcelain >/dev/null 2>&1; then
  if [[ -n "$(git status --porcelain)" ]]; then
    dirty="dirty"
  fi
fi

echo "== czz quality gate =="
echo "timestamp_utc:  $ts_utc"
echo "timestamp_local:$ts_local"
echo "mode:           $mode"
echo "git_sha:        $sha_full"
echo "git_short:      $sha_short"
echo "git_branch:     $branch"
echo "git_state:      $dirty"
echo "node:           $(node -v 2>/dev/null || echo 'not_found')"
echo "pnpm:           $(pnpm -v 2>/dev/null || echo 'not_found')"
echo ""

run_step() {
  local name="$1"; shift
  echo "---- step: $name ----"
  local start
  start="$(date +%s)"
  "$@"
  local end
  end="$(date +%s)"
  echo "---- ok: $name (elapsed: $((end - start))s) ----"
  echo ""
}

# 1) biome check (lints + formatting checks)
run_step "biome-check" pnpm check

# 2) typecheck (best-effort)
typecheck_ran="0"
if pnpm -s run | awk '{print $1}' | grep -qx "typecheck"; then
  run_step "typecheck" pnpm typecheck
  typecheck_ran="1"
elif [[ -f "tsconfig.json" ]]; then
  if pnpm exec tsc -v >/dev/null 2>&1; then
    run_step "typecheck" pnpm exec tsc -p tsconfig.json --noEmit --pretty false
    typecheck_ran="1"
  fi
fi

if [[ "$typecheck_ran" != "1" ]]; then
  if [[ "$require_typecheck" == "1" ]]; then
    echo "ERROR: typecheck step could not be executed."
    echo "       Add a root script: \"typecheck\": \"tsc -p tsconfig.json --noEmit\""
    echo "       or provide a usable root tsconfig.json."
    exit 3
  fi
  echo "WARN: typecheck skipped (no pnpm script 'typecheck' and no usable root tsconfig.json)."
  echo "      To enforce it, rerun with REQUIRE_TYPECHECK=1."
  echo ""
fi

# 3) tests
run_step "test" pnpm test

# 4) optional build
if [[ "$verify_build" == "1" ]]; then
  run_step "build" pnpm build
fi

echo "== SUCCESS =="
