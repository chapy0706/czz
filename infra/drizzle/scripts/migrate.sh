# infra/drizzle/scripts/migrate.sh
#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DB_URL:-}" ]]; then
  echo "ERROR: DB_URL is not set."
  echo "Hint: DB_URL=postgres://... make db-migrate"
  exit 1
fi

# drizzle-kit が参照しうる env をまとめて揃える（プロジェクト差異を吸収）
export DATABASE_URL="${DB_URL}"
export DATABASE_URL_UNPOOLED="${DB_URL}"
export POSTGRES_URL="${DB_URL}"
export DB_URL="${DB_URL}"

CONFIG_CANDIDATES=(
  "infra/drizzle/drizzle.config.ts"
  "infra/drizzle/drizzle.config.mjs"
  "infra/drizzle/drizzle.config.js"
  "drizzle.config.ts"
  "drizzle.config.mjs"
  "drizzle.config.js"
)

CONFIG_PATH=""
for c in "${CONFIG_CANDIDATES[@]}"; do
  if [[ -f "$c" ]]; then
    CONFIG_PATH="$c"
    break
  fi
done

echo "DB_URL=${DB_URL}"
if [[ -n "${CONFIG_PATH}" ]]; then
  echo "Using drizzle config: ${CONFIG_PATH}"
else
  echo "WARN: drizzle config file not found in known locations."
  echo "      Trying drizzle-kit migrate without --config."
fi

if [[ -n "${CONFIG_PATH}" ]]; then
  pnpm -w exec drizzle-kit migrate --config "${CONFIG_PATH}"
else
  pnpm -w exec drizzle-kit migrate
fi

echo "OK: migrations applied."
