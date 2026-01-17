# infra/drizzle/scripts/db_count.sh
#!/usr/bin/env bash
set -euo pipefail

# Accept either DB_URL (preferred) or DATABASE_URL (fallback)
DB_URL="${DB_URL:-${DATABASE_URL:-}}"

if [[ -z "${DB_URL:-}" ]]; then
  echo "ERROR: DB_URL (or DATABASE_URL) is not set."
  echo "Hint:"
  echo "  DB_URL=postgres://... make db-count"
  echo "  # or"
  echo "  DATABASE_URL=postgres://... make db-count"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql command not found."
  echo "Hint: install PostgreSQL client (psql)."
  exit 1
fi

# Heuristic: pooler endpoints often contain '-pooler' (Neon PgBouncer)
if [[ "${DB_URL}" == *"-pooler"* || "${DB_URL}" == *"pooler"* ]]; then
  echo "NOTE: DB_URL looks like a pooled (PgBouncer) endpoint."
  echo "      For migrate/seed, prefer a direct/unpooled endpoint when available."
  echo ""
fi

echo "== connection =="
psql "${DB_URL}" -v ON_ERROR_STOP=1 -Atc \
"select
  'db='||current_database()
  ||' user='||current_user
  ||' schema='||current_schema();"
psql "${DB_URL}" -v ON_ERROR_STOP=1 -Atc \
"select
  'server='||coalesce(inet_server_addr()::text,'(unknown)')
  ||':'||coalesce(inet_server_port()::text,'(unknown)');"
psql "${DB_URL}" -v ON_ERROR_STOP=1 -Atc "select 'search_path='||current_setting('search_path');"
echo ""

echo "== tables (non-system) =="
psql "${DB_URL}" -v ON_ERROR_STOP=1 -c \
"select schemaname as schema_name, tablename as table_name
   from pg_tables
  where schemaname not in ('pg_catalog','information_schema')
  order by schemaname, tablename;"
echo ""

echo "== drizzle migrations table =="
psql "${DB_URL}" -v ON_ERROR_STOP=1 -Atc \
"select coalesce(string_agg(schemaname||'.'||tablename, ', '), 'none')
   from pg_tables
  where tablename='__drizzle_migrations'
    and schemaname not in ('pg_catalog','information_schema');"
echo ""

echo "== counting target tables (users/tasks/results) =="
targets_raw="$(
  psql "${DB_URL}" -v ON_ERROR_STOP=1 -Atc \
  "select schemaname||E'\t'||tablename
     from pg_tables
    where tablename in ('users','tasks','results')
      and schemaname not in ('pg_catalog','information_schema')
    order by schemaname, tablename;"
)"

if [[ -z "${targets_raw}" ]]; then
  echo "ERROR: expected tables not found: users/tasks/results"
  echo "Hint:"
  echo "  - migrations が 0 件の可能性（migrationファイルが無い/別場所）"
  echo "  - 別DB/別ブランチに migrate した可能性（connection 出力の db/user/server を確認）"
  echo "  - スキーマ名が違う可能性（上の tables 一覧を確認）"
  echo "  - search_path が public を見ていない可能性（search_path 出力を確認）"
  exit 1
fi

# macOS の /bin/bash (3.2) には mapfile が無いので、while read で処理する
while IFS= read -r row; do
  [[ -z "${row}" ]] && continue
  schema="${row%%$'\t'*}"
  table="${row#*$'\t'}"

  if [[ -z "${schema}" || -z "${table}" || "${schema}" == "${row}" ]]; then
    echo "WARN: unexpected row format: ${row}"
    continue
  fi

  count="$(psql "${DB_URL}" -v ON_ERROR_STOP=1 -Atc "select count(*) from \"${schema}\".\"${table}\";")"
  echo "${schema}.${table}=${count}"
done <<< "${targets_raw}"

echo "OK: counts printed."
