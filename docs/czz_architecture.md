# czz アーキテクチャ概要

czz は Clean Architecture の依存方向を守る「軽量な分離」を採用します。

## 依存方向（内向きのみ）
- UI / API（apps） → Application（usecases） → Domain（packages/domain）
- Infrastructure（infra/drizzle）は Domain の Repository interface を実装するだけ
- `packages/dsl-core` は Domain 非依存の実行エンジン

## 境界の考え方
- **unknown → Zod**: 外部入力・DB JSON は必ず Zod で検証してから扱う
- **Server / Client**: UI は Client Component、API は Server 側で処理
- **Repository interface**: Application は interface だけに依存する

## 現行の構成（抜粋）
- `apps/user`: 学習者向け UI + API（BFF）
- `apps/admin`: 管理画面 CRUD
- `packages/domain`: ドメインモデル / Repository interface
- `packages/dsl-core`: DSL schema / execute / testRunner
- `infra/drizzle`: Drizzle ORM / PostgreSQL / migration / seed

## 参照
- 詳細設計: `./specs/active/`
- 運用: `./runbook/`
