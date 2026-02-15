# Seed & Test

目的: 検証と再現手順を揃える。詳細は `./runbook/` を参照。

## 品質ゲート
- `make verify`
- `make evidence`

## DB まわり（ローカル専用）
- 初期化や再投入は runbook の手順に従う
- 破壊的操作はローカル環境に限定
- 代表ターゲット: `make db-reset` / `make db-migrate` / `make db-seed`

## E2E
- 入口: `scripts/run-e2e.mjs`

## 参照
- 仕様（SSOT）: `./specs/`
- 運用: `./runbook/`
