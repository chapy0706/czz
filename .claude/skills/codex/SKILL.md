<!-- .claude/skills/codex/SKILL.md -->

# /codex — Codex連携の下準備（read-only）

このスキルは **実装を行わない**。目的は「仕様ズレを減らす」「無駄に読まない」「安全に次の一手を決める」。

## ルール（必読）

- このリポジトリの真実は `docs/specs/active/<spec>.md`
- Issue本文ではなく spec を読む
- 読む前に rg/grep で絞る（全体読み禁止）
- `.env / keys / tokens / secrets` を読まない・出さない
- 破壊的コマンドは禁止（rm -rf / reset --hard / force push）
- 外部ネットワークアクセスは原則しない（必要なら人間確認）

参照:

- CLAUDE.md
- AGENTS.md
- `.claude/rules/*`
- docs/runbook/debug-panel.md

## 使い方

### 1) Spec を指定して分析する

入力（例）:

- /codex spec=docs/specs/active/2026-02-09-issue-TBD-claude-code-skills-codex-orchestration.md

出力は以下の順で書く:

1. Specの要約（Goal / Non-goals / AC）
2. 変更対象の当たり（候補ファイル・責務）
3. リスク（安全/変更容易性/性能/運用 の4軸で短く）
4. 実行計画（最小ステップ、verify/evidence まで）
5. Codex に渡す最小プロンプト（後述テンプレ）

### 2) Codex に渡す最小プロンプト（テンプレ）

以下をコピペ用に出す（中身は埋めて提示する）:

- spec: <PATH>
- do: <作業内容を3〜7行>
- dont: <禁止事項>
- touch: <触って良い領域（例: apps/user/src/...）>
- verify: make verify
- evidence: make evidence
- output: 変更ファイル一覧 / SHA / evidenceログ名

## 出力の品質バー

- SpecのACに紐づく説明になっている
- 「何を読んだか（ファイル名）」が残っている
- 迷ったら “やらない/止める” を選べている
