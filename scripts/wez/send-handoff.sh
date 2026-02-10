#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: send-handoff.sh --to codex|claude --file <path>
USAGE
}

recipient=""
file_path=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --to)
      recipient="${2:-}"
      shift 2
      ;;
    --file)
      file_path="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$recipient" || -z "$file_path" ]]; then
  usage
  exit 1
fi

if [[ "$recipient" != "codex" && "$recipient" != "claude" ]]; then
  echo "--to must be 'codex' or 'claude'" >&2
  exit 1
fi

if [[ ! -f "$file_path" ]]; then
  echo "File not found: $file_path" >&2
  exit 1
fi

pane_id=""
if [[ "$recipient" == "codex" ]]; then
  pane_id="${WEZ_PANE_CODEX:-}"
else
  pane_id="${WEZ_PANE_CLAUDE:-}"
fi

if [[ -z "$pane_id" ]]; then
  echo "Pane id not set. Export WEZ_PANE_CODEX or WEZ_PANE_CLAUDE." >&2
  exit 1
fi

size_bytes=$(wc -c < "$file_path" | tr -d ' ')
size_limit=$((100 * 1024))

if (( size_bytes > size_limit )); then
  echo "Abort: file size ${size_bytes} bytes exceeds 100KB limit." >&2
  exit 1
fi

if grep -E -i -q 'rm -rf|reset --hard|force push|push --force|secrets|\.env' "$file_path"; then
  echo "Abort: dangerous terms detected in file." >&2
  exit 1
fi

echo "--- Preview (first 20 lines) ---"
head -n 20 "$file_path"
echo "---"
echo "Size: ${size_bytes} bytes"

read -r -p "Send to ${recipient} pane (${pane_id})? Type 'y' to proceed: " confirm
if [[ "$confirm" != "y" ]]; then
  echo "Cancelled."
  exit 0
fi

content=$(cat "$file_path")
printf '%s\n' "$content" | wezterm cli send-text --pane-id "$pane_id"
