#!/usr/bin/env bash
# scripts/evidence.sh
# Purpose: run verify and persist stdout/stderr into out/evidence/<timestamp>-<sha>.log

set -euo pipefail
set -o pipefail

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

evidence_dir="${EVIDENCE_DIR:-out/evidence}"
mkdir -p "$evidence_dir"

ts="$(date -u +%Y%m%dT%H%M%SZ)"
sha="$(git rev-parse --short=12 HEAD 2>/dev/null || echo 'nogit')"
dirty_suffix=""
if git status --porcelain >/dev/null 2>&1; then
  if [[ -n "$(git status --porcelain)" ]]; then
    dirty_suffix="-dirty"
  fi
fi

log="${evidence_dir}/${ts}-${sha}${dirty_suffix}.log"

echo "Writing evidence log: $log"
echo ""

VERIFY_BUILD="${VERIFY_BUILD:-0}" REQUIRE_TYPECHECK="${REQUIRE_TYPECHECK:-0}" \
  bash scripts/verify.sh "$mode" 2>&1 | tee "$log"
rc="${PIPESTATUS[0]}"

if [[ "$rc" -ne 0 ]]; then
  echo ""
  echo "== FAILED (exit: $rc) =="
  echo "Evidence saved: $log"
  exit "$rc"
fi

echo ""
echo "== OK =="
echo "Evidence saved: $log"
