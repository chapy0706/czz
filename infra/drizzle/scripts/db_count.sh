# infra/drizzle/scripts/db_count.sh
#!/usr/bin/env bash
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
echo ""

echo "== connection =="
psql "${DB_URL}" -v ON_ERROR_STOP=1 -Atc "select 'db='||current_database()||' schema='||current_schema();"
echo ""

echo "== tables (non-system) =="
psql "${DB_URL}" -v ON_ERROR_STOP=1 -c \
"select schemaname as schema, tablename as table
 from pg_tables
 where schemaname not in ('pg_catalog','information_schema')
 order by 1,2;"
echo ""

echo "== drizzle migrations table =="
psql "${DB_URL}" -v ON_ERROR_STOP=1 -Atc \
"select coalesce(string_agg(schemaname||'.'||tablename, ', '), 'none')
 from pg_tables
 where tablename='__drizzle_migrations'
   and schemaname not in ('pg_catalog','information_schema');"
echo ""

echo "== counting target tables (users/tasks/results) =="
mapfile -t targets < <(
  psql "${DB_URL}" -v ON_ERROR_STOP=1 -Atc \
  "select schemaname||E'\t'||tablename
     from pg_tables
    where tablename in ('users','tasks','results')
      and schemaname not in ('pg_catalog','information_schema')
    order by 1,2;"
)

if [[ "${#targets[@]}" -eq 0 ]]; then
  echo "ERROR: expected tables not found: users/tasks/results"
  echo "Hint:"
  echo "  - migrations が 0 件の可能性（migrationファイルが無い/別場所）"
  echo "  - 別DB/別ブランチに migrate した可能性"
  echo "  - スキーマ名が違う可能性（上の tables 一覧を確認）"
  exit 1
fi

for row in "${targets[@]}"; do
  schema="${row%%$'\t'*}"
  table="${row#*$'\t'}"
  count="$(psql "${DB_URL}" -v ON_ERROR_STOP=1 -Atc "select count(*) from \"${schema}\".\"${table}\";")"
  echo "${schema}.${table}=${count}"
done

echo "OK: counts printed."
