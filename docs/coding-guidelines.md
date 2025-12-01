# Coding Guidelines

## Philosophy

- UNIX 哲学: 小さく、単純に、1 つのことをうまくやる
- 型安全・TDD を優先
- UI とロジックと DB を混ぜない

## Project Structure

- apps/user: プレイヤー用 UI
- apps/admin: 管理画面
- packages/types: 型・Zod スキーマ
- packages/dsl-core: DSL の実装
- packages/ui: 共通 UI コンポーネント
- infra/drizzle: DB スキーマとマイグレーション

## TypeScript

- strict: true
- any 禁止方針
- type alias を基本とする
- 命名規則...

## DB / Drizzle

- schema.ts が真実
- migration は generate → push のフローで実施
- アプリからは repository 経由で DB に触る

...
