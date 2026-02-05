#!/usr/bin/env bash
# /scripts/evidence.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

MODE="${VERIFY_MODE:-local}"
EVIDENCE_DIR="${EVIDENCE_DIR:-out/evidence}"

mkdir -p "$EVIDENCE_DIR"

sha="no-git"
branch="unknown"
dirty="unknown"

if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  sha="$(git rev-parse --short HEAD || echo no-git)"
  branch="$(git rev-parse --abbrev-ref HEAD || echo unknown)"
  dirty="$(git status --porcelain | wc -l | tr -d ' ')"
fi

ts="$(date -u +'%Y%m%dT%H%M%SZ')"
log="${EVIDENCE_DIR}/${ts}-${sha}.log"

{
  echo "czz.evidence"
  echo "  ts_utc=${ts}"
  echo "  sha=${sha}"
  echo "  branch=${branch}"
  echo "  dirty=${dirty}"
  if command -v node >/dev/null 2>&1; then echo "  node=$(node -v)"; fi
  if command -v pnpm >/dev/null 2>&1; then echo "  pnpm=$(pnpm -v)"; fi
  if command -v uname >/dev/null 2>&1; then echo "  os=$(uname -a)"; fi
  echo ""
  VERIFY_MODE="${MODE}" bash "${ROOT_DIR}/scripts/verify.sh"
} 2>&1 | tee "${log}"

status="${PIPESTATUS[0]}"
echo "" | tee -a "${log}" >/dev/null
echo "log_path=${log}" | tee -a "${log}" >/dev/null

exit "${status}"
