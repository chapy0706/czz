<!-- docs/specs/README.md -->

# specs（仕様）運用

## ここは何？
- 仕様（Spec）の単一の真実（Single Source of Truth）
- GitHub Issue は「入口」で、仕様本文はここに置く
- AI（Claude/Codex）は Issue本文ではなく spec を読む（ズレ防止 + トークン節約）

## 置き場所
- docs/specs/active/ : 進行中（AIが読む）
- docs/specs/archive/ : 完了（削除せず移動でノイズを減らす）

## ファイル命名
- YYYY-MM-DD-issue-<number>-<short-title>.md

## Spec First
- 仕様変更は spec 更新から始める
- 実装で学びが出たら spec を更新して整合させる

## Issue（入口）の推奨フォーマット（AI特化）
Issueは短く保つ（チェックボックス多用は避ける）。
- Context（2〜4行）
- Scope（Do / Don’t）
- Spec link（1本）
- Evidence（make verify / make evidence / CI）
- DoD（短い条件）

## 必須セクション（spec）
- Goal / Non-goals
- Acceptance Criteria
- NFR（安全・変更容易性・性能・運用）
- Test Plan（証拠の取り方）
- Risks / Rollout（必要なら）

## テンプレ
- docs/specs/_template.md
