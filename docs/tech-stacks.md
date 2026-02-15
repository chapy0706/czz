# 技術スタック

役割別に「何をどこで使うか」を整理します。詳細は SSOT（`docs/specs/`）を参照。

## UI
- Next.js 15（App Router）
- Tailwind CSS
- shadcn/ui
- Clerk（認証）
- Zustand（状態）

## API / BFF
- Next.js Route Handlers
- Zod（境界のバリデーション）

## Domain
- `packages/domain`（エンティティ / Repository interface）

## DSL
- `packages/dsl-core`（schema / execute / testRunner）
- Zod

## DB
- Drizzle ORM
- PostgreSQL
- `infra/drizzle`（migration / seed）

## QA
- Vitest（unit）
- Playwright（e2e）
- Biome（lint/format）
