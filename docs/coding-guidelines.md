# czz コーディングガイドライン

4つの軸で判断します: **安全性 / 変更容易性 / 性能 / 運用**。

## 安全性
- 外部入力・DB JSON は `unknown → Zod` で境界を作る
- ログに機密情報を出さない
- 破壊的な操作は runbook に従う

## 変更容易性
- Domain は他レイヤーに依存しない
- Application は Repository interface にのみ依存
- DSL は `packages/dsl-core` に閉じる
- 仕様の単一の真実（SSOT）は `docs/specs/`

## 性能
- 変更での性能悪化がないかを確認
- 重い処理は API/BFF 側で閉じる

## 運用
- `make verify` と `make evidence` を必ず実行
- 変更点は spec と一致させる
- 迷ったら `./runbook/` に戻る

## モノレポ編集の基本
- 変更対象の責務と依存方向を確認
- 関係ないパッケージへ広げない
- `apps/**` / `packages/**` / `infra/**` の境界を越える場合は理由を書く
