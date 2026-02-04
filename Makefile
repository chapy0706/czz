# /Makefile
# Purpose: developer-friendly entrypoints for common workflows.
# Safety: defaults are pinned to local dev (czz_dev on localhost:5433).
# Usage: make help

SHELL := /usr/bin/env bash
.DEFAULT_GOAL := help

DB_URL ?= postgres://app:app@localhost:5433/czz_dev
COMPOSE_FILE ?= infra/docker/docker-compose.dev.yml
ALLOW_NONLOCAL ?= 0

# Quality gate toggles
VERIFY_BUILD ?= 0
VERIFY_MODE ?= local
EVIDENCE_DIR ?= out/evidence
REQUIRE_TYPECHECK ?= 0

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
	@echo "DB (migrate/seed/verify)"
	@echo "  make db-migrate      Apply Drizzle migrations (safe default DB_URL)"
	@echo "  make db-reset        Cleanup+insert+verify seed data (safe default DB_URL)"
	@echo "  make db-verify       Run verification queries"
	@echo "  make db-count        Print row counts (users/tasks/results)"
	@echo ""
	@echo "Apps"
	@echo "  make dev-user        Start apps/user (Next.js) on 3100"
	@echo "  make dev-admin       Start apps/admin (Next.js) on 3001"
	@echo ""
	@echo "Tests"
	@echo "  make test-user       Run vitest in apps/user"
	@echo "  make test-dsl        Run vitest in packages/dsl-core"
	@echo ""
	@echo "Quality Gate"
	@echo "  make verify          Run biome check + typecheck (best-effort) + test (+ build if VERIFY_BUILD=1)"
	@echo "  make ci              CI-friendly verify (non-interactive, stable env)"
	@echo "  make evidence        Save verify logs to out/evidence/<timestamp>-<sha>.log"
	@echo ""
	@echo "Quality Gate options"
	@echo "  VERIFY_BUILD=1        Include pnpm build"
	@echo "  REQUIRE_TYPECHECK=1   Fail if typecheck cannot be executed"
	@echo ""
	@echo "Override examples"
	@echo "  VERIFY_BUILD=1 make verify"
	@echo "  VERIFY_BUILD=1 make evidence"
	@echo "  REQUIRE_TYPECHECK=1 make verify"
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

.PHONY: db-migrate
db-migrate:
	$(call assert_safe_db)
	DB_URL="$(DB_URL)" bash infra/drizzle/scripts/migrate.sh

.PHONY: db-reset
db-reset:
	$(call assert_safe_db)
	DB_URL="$(DB_URL)" bash infra/drizzle/scripts/seed_reset.sh

.PHONY: db-verify
db-verify:
	$(call assert_safe_db)
	psql "$(DB_URL)" -f infra/drizzle/scripts/seed_verify.sql

.PHONY: db-count
db-count:
	$(call assert_safe_db)
	DB_URL="$(DB_URL)" bash infra/drizzle/scripts/db_count.sh

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

.PHONY: verify
verify:
	VERIFY_BUILD="$(VERIFY_BUILD)" REQUIRE_TYPECHECK="$(REQUIRE_TYPECHECK)" \
	bash scripts/verify.sh "$(VERIFY_MODE)"

.PHONY: ci
ci:
	CI=1 NO_COLOR=1 FORCE_COLOR=0 TERM=dumb NPM_CONFIG_COLOR=never \
	VERIFY_BUILD="$(VERIFY_BUILD)" REQUIRE_TYPECHECK="$(REQUIRE_TYPECHECK)" \
	bash scripts/verify.sh ci

.PHONY: evidence
evidence:
	EVIDENCE_DIR="$(EVIDENCE_DIR)" VERIFY_BUILD="$(VERIFY_BUILD)" REQUIRE_TYPECHECK="$(REQUIRE_TYPECHECK)" \
	bash scripts/evidence.sh "$(VERIFY_MODE)"
