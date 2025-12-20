#!/usr/bin/env bash
set -euo pipefail

DB_URL="${DB_URL:-postgres://app:app@localhost:5433/czz_dev}"
DIR="$(cd "$(dirname "$0")" && pwd)"

psql "$DB_URL" -f "$DIR/seed_cleanup.sql"
psql "$DB_URL" -f "$DIR/seed_insert.sql"
psql "$DB_URL" -f "$DIR/seed_verify.sql"

echo "seed reset completed"
