# Makefile
# Purpose: developer-friendly entrypoints for common workflows.
# Safety: defaults are pinned to local dev (czz_dev on localhost:5433).
# Usage: make help

SHELL := /usr/bin/env bash
.DEFAULT_GOAL := help

DB_URL ?= postgres://app:app@localhost:5433/czz_dev
COMPOSE_FILE ?= infra/docker/docker-compose.dev.yml
ALLOW_NONLOCAL ?= 0

define assert_safe_db
	@set -euo pipefail; \
	if [[ "$(ALLOW_NONLOCAL)" != "1" ]]; then \
	  if [[ "$(DB_URL)" != postgres://app:app@localhost:5433/czz_dev* ]]; then \
	    echo "ERROR: Refusing to run against non-default DB_URL."; \
	    echo "       DB_URL=$(DB_URL)"; \
	    echo "       If you really intend this, rerun with ALLOW_NONLOCAL=1."; \
	    exit 1; \
	  fi; \
	fi
endef

.PHONY: help
help:
	@echo ""
	@echo "czz dev commands"
	@echo ""
	@echo "DB (docker-compose)"
	@echo "  make db-up           Start dev DB (docker compose)"
	@echo "  make db-down         Stop dev DB"
	@echo "  make db-logs         Tail dev DB logs"
	@echo ""
	@echo "DB (seed/reset)"
	@echo "  make db-reset        Cleanup+insert+verify seed data (safe default DB_URL)"
	@echo "  make db-verify       Run verification queries"
	@echo ""
	@echo "Apps"
	@echo "  make dev-user        Start apps/user (Next.js) on 3100"
	@echo "  make dev-admin       Start apps/admin (Next.js) on 3001"
	@echo ""
	@echo "Tests"
	@echo "  make test-user       Run vitest in apps/user"
	@echo "  make test-dsl        Run vitest in packages/dsl-core"
	@echo ""
	@echo "Override examples"
	@echo "  DB_URL=postgres://app:app@localhost:5433/czz_dev make db-reset"
	@echo "  ALLOW_NONLOCAL=1 DB_URL=postgres://... make db-reset   # NOT recommended"
	@echo ""

.PHONY: db-up
db-up:
	docker compose -f "$(COMPOSE_FILE)" up -d

.PHONY: db-down
db-down:
	docker compose -f "$(COMPOSE_FILE)" down

.PHONY: db-logs
db-logs:
	docker compose -f "$(COMPOSE_FILE)" logs -f db

.PHONY: db-reset
db-reset:
	$(call assert_safe_db)
	DB_URL="$(DB_URL)" bash infra/drizzle/scripts/seed_reset.sh

.PHONY: db-verify
db-verify:
	$(call assert_safe_db)
	psql "$(DB_URL)" -f infra/drizzle/scripts/seed_verify.sql

.PHONY: dev-user
dev-user:
	pnpm --filter user-app dev

.PHONY: dev-admin
dev-admin:
	pnpm --filter admin-app dev

.PHONY: test-user
test-user:
	pnpm --filter user-app exec vitest

.PHONY: test-dsl
test-dsl:
	pnpm --filter @czz/dsl-core test