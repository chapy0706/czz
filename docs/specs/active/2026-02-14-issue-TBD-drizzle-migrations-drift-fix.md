<!-- docs/specs/active/2026-02-14-issue-TBD-drizzle-migrations-drift-fix.md -->

# Spec: Drizzle マイグレーション drift 解消（schema.ts を SSOT に統一）

- Status: active
- Updated: 2026-02-14
- SSOT: このSpec

## Background
現状、DB 実体とコードのスキーマ前提がズレている。
具体的には、コード側が `updated_at` を参照するのに対し、DB の users テーブルに `updated_at` が存在しないため `column "updated_at" does not exist` が発生した。

また、`make db-migrate` 実行時に `drizzle-kit not found` が出ており、移行手段そのものが壊れている。

## Principles（運用原則）
- SSOT は `infra/drizzle/schema.ts`（TypeScript）とする。
- migration SQL は **生成物**。過去 migration を編集して辻褄合わせしない。
- スキーマ変更は「schema.ts 更新 → 新規 migration 生成 → migrate」の順。
- 開発DBで drift が出たら、まず `make db-reset`（必要なら docker volume 再作成）で整合を取る。

## Acceptance Criteria
### AC1: drizzle-kit が見つかる
- repo root で `pnpm -w exec drizzle-kit --version` が成功する。
- `make db-migrate` が `drizzle-kit not found` で落ちない。

### AC2: migrate スクリプトが堅い
- `infra/drizzle/scripts/migrate.sh` は repo root で実行され、`pnpm -w exec` 経由で drizzle-kit を呼ぶ。
- どの作業ディレクトリから `make db-migrate` しても成功する。

### AC3: users に updated_at が存在する
- `make db-migrate` 後に、開発DBで `\d+ users` を実行すると `updated_at` が存在する。
- `column "updated_at" does not exist` が再現しない。

### AC4: drift 対処手順が明文化
- drift 発生時の手順（db-reset / volume recreate）を Spec に記載する。

## Implementation Plan（最小ステップ）
1. ルートに drizzle-kit を導入（または依存の修復）
   - `pnpm -w exec drizzle-kit --version` が通るまで整える。
2. migrate.sh を修正
   - `cd "$(git rev-parse --show-toplevel)"` してから `pnpm -w exec drizzle-kit ...`
3. `make db-migrate` 実行
4. `psql ... -c "\d+ users"` で `updated_at` を確認
5. drift が残る場合
   - `make db-reset`（必要なら docker volume を消して作り直す）
6. `make verify` を回して最低限の整合を確認

## Drift 解消手順（開発DB）
- まず:
  - `make db-migrate`
- 直らない場合:
  - `make db-reset`
- それでも直らない（docker volume が古い）場合:
  - `docker compose -f infra/docker/docker-compose.dev.yml down -v`
  - `make db-up`
  - `make db-migrate`
  - `make db-reset`

## Claude Code / Codex 協奏コマンド
### Step 1: /codex（Plan: read-only）
/codex spec=docs/specs/active/2026-02-14-issue-TBD-drizzle-migrations-drift-fix.md

### Step 3: /claude-codex-workflow
/claude-codex-workflow spec=docs/specs/active/2026-02-14-issue-TBD-drizzle-migrations-drift-fix.md mode=normal

## Codex Prompt（minimum）
spec: docs/specs/active/2026-02-14-issue-TBD-drizzle-migrations-drift-fix.md

do:
- drizzle-kit not found を解消（pnpm workspace root で `pnpm -w exec drizzle-kit` が通る）
- migrate.sh を repo root + pnpm -w exec で堅牢化
- make db-migrate → psql で users.updated_at を確認できる状態にする
- drift 対処手順を spec に追記（必要なら）

dont:
- 既存 migration を編集しない
- DBスキーマを手でSQLだけ当てて終わらせない（SSOT維持）
- git push しない
- secrets を触らない

output:
- git diff --name-only
- sha（git rev-parse --short HEAD）
- evidence（実行ログ/コマンド結果）
