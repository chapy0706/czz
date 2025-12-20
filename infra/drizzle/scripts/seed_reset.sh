#!/usr/bin/env bash
set -euo pipefail

DB_URL="${DB_URL:-postgres://app:app@localhost:5433/czz_dev}"
DIR="$(cd "$(dirname "$0")" && pwd)"

psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$DIR/seed_cleanup.sql"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$DIR/seed_insert.sql"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$DIR/seed_verify.sql"

echo "seed reset completed"
