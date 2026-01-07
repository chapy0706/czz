#!/usr/bin/env bash
# infra/drizzle/scripts/db_count.sh
set -euo pipefail

if [[ -z "${DB_URL:-}" ]]; then
  echo "ERROR: DB_URL is not set."
  echo "Hint: DB_URL=postgres://... make db-count"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql command not found."
  echo "Hint: install PostgreSQL client (psql)."
  exit 1
fi

echo "DB_URL=${DB_URL}"
echo "Counting rows..."

psql "${DB_URL}" -v ON_ERROR_STOP=1 -Atc "
select 'users='  || count(*) from users;
select 'tasks='  || count(*) from tasks;
select 'results='|| count(*) from results;
"
