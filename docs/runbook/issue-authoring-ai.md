<!-- docs/runbook/issue-authoring-ai.md -->

# AI特化 Issue 運用（ズレない / 低トークン）

## 結論
- Issue は入口（短い）
- spec が真実（docs/specs/active）
- AI（Claude/Codex）は spec を読む

## Issue本文テンプレ（推奨）
- Context（2〜4行）
- Scope（Do / Don’t）
- Spec link（1本）
- Evidence（make verify / make evidence / CI）
- DoD（短い条件）

## spec テンプレ（必須）
- Goal / Non-goals
- Acceptance Criteria
- NFR（安全・変更容易性・性能・運用）
- Test Plan（証拠の取り方）

## 依頼するときに渡す情報（最小セット）
- タイトル
- 背景（3行以内）
- Goal（1〜3個）
- Non-goals
- Acceptance Criteria
- NFR（4軸を1行ずつでも）
- Evidence（必須コマンド）
- 触って良い領域 / 禁止事項
