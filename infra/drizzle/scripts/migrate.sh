#!/usr/bin/env bash
# infra/drizzle/scripts/migrate.sh
set -euo pipefail

if [[ -z "${DB_URL:-}" ]]; then
  echo "ERROR: DB_URL is not set."
  echo "Hint: DB_URL=postgres://... make db-migrate"
  exit 1
fi

# drizzle-kit は通常 DATABASE_URL を参照するため、互換のために転写する
export DATABASE_URL="${DB_URL}"

# drizzle config の候補をいくつか探す（プロジェクト差異を吸収）
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

# 期待する動作:
# - drizzle-kit が devDependencies にある（pnpm workspace）
# - migrations の実行（DDL反映）
if [[ -n "${CONFIG_PATH}" ]]; then
  pnpm -w exec drizzle-kit migrate --config "${CONFIG_PATH}"
else
  pnpm -w exec drizzle-kit migrate
fi

echo "OK: migrations applied."
