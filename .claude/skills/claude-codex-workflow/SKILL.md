<!-- .claude/skills/claude-codex-workflow/SKILL.md -->

# /claude-codex-workflow — Claude→Codex協奏の実行ワークフロー

このスキルは「Plan → Approve → Implement → Verify」を固定し、作業の再現性と安全性を上げる。

## ルール（必読）

- 真実は `docs/specs/active/<spec>.md`（Issue本文ではなく spec）
- `.env / keys / tokens / secrets` を読まない・出さない・コミットしない
- 破壊的コマンド禁止（rm -rf / reset --hard / force push）
- 外部ネットワークアクセスは原則しない（必要なら人間確認）
- 読む前に絞る（rg/grep、範囲指定）
- 最後に必ず `make verify` と `make evidence`（ログは out/evidence）

参照:

- CLAUDE.md / AGENTS.md
- `.claude/rules/*`
- docs/runbook/debug-panel.md

## 入力形式

- /claude-codex-workflow spec=<PATH> [mode=poc|normal]

mode:

- poc: 変更は最小（1仮説・1変更）
- normal: spec のACを満たす範囲で実装

## 手順

### Phase 1: Plan（Claude）

1. spec を読み、以下を作る
   - AC対応の作業分解（最小ステップ）
   - 影響範囲（候補ファイル）
   - リスク（安全/変更容易性/性能/運用）
   - 検証計画（make verify / make evidence）

2. Codexへ渡す「実行プロンプト」を組み立てる（次項）

### Phase 2: Approve（人間）

- Claude はここで止まる。人間が承認するまでは Implement に進まない。
- 承認の観点（短く）:
  - specのACと一致しているか
  - 禁止事項に触れていないか
  - 変更が最小か（pocなら特に）

### Phase 3: Implement（Codex CLI）

- ここから Codex を起動して実装させる（実行は人間が行う）
- Codex に渡すプロンプト（テンプレ）:

  spec: <PATH>
  mode: <poc|normal>

  do:
  - <実装すること（3〜10行）>

  dont:
  - spec外の機能追加禁止
  - .env/keys/tokens/secrets を扱わない
  - 破壊的コマンド禁止
  - git push しない（人間が実行）

  touch:
  - <触って良い領域（例: .claude/skills/**, docs/specs/**, docs/issues/\*\*, CLAUDE.md）>

  must:
  - 変更は最小（pocなら1仮説）
  - 実装後に make verify
  - 最後に make evidence（out/evidence にログ）
  - 引継ぎ4点: specパス / git diff --name-only / SHA / evidenceログ名

### Phase 4: Verify（Claude）

- Codexの結果（変更ファイル/verify/evidenceログ）を材料に、以下の形式でまとめる
  1. ACの達成状況（○/△/×）
  2. 変更ファイル一覧（git diff --name-only）
  3. 実行したコマンドと結果（make verify / make evidence）
  4. 次にやること（必要ならspec更新）

## 出力の品質バー

- “spec→実装→検証→証拠” が一直線
- 読み物ではなく「次に迷わない道具」になっている
- 失敗してもログと切り分けが残っている
