<!-- docs/issues/2026-02-09-issue-TBD-claude-code-skills-codex-orchestration.md -->

# Issue: Claude Code Skills で Codex 連携をワークフロー化する（#70拡張）

Context:
- Claude Code と Codex の連携を Skills で型化し、Plan→Approve→Implement→Verify を再現可能にする。
- Issue は入口に徹し、仕様の単一の真実は spec に置く。

Scope（Do）:
- `.claude/skills/` にプロジェクトスキルを追加
  - /codex（read-only: 実装方針/影響範囲/リスク整理）
  - /claude-codex-workflow（実装手順: Codex呼び出し→verify→evidence）
- SSOT と安全ガード（spec参照/秘密情報禁止/破壊的コマンド禁止/外部アクセス原則禁止）を Skills に明記
- PoC（最小変更）で verify/evidence を1往復成功させる

Scope（Don’t）:
- アプリ機能の新規追加
- 自動承認（Approve省略）
- MCP 等の別方式への全面移行

Spec（Single Source of Truth）:
- docs/specs/active/2026-02-09-issue-TBD-claude-code-skills-codex-orchestration.md

Evidence:
- make verify
- make evidence（out/evidence にログ生成）

DoD:
- spec の AC を満たす
- PoC が 1 回以上成功（verify/evidence）
- 引継ぎ4点（spec/変更ファイル/SHA/evidenceログ名）が揃う
- 秘密情報が repo に含まれない
