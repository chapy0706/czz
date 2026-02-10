<!-- docs/specs/active/2026-02-10-issue-TBD-wezterm-handoff-claude-codex-y-approve.md -->

# Spec: WezTerm ペイン間ハンドオフ自動化（Claude Code ⇄ Codex / y 承認）

- Issue: TBD
- Updated: 2026-02-10
- Owner: TBD
- Status: active

## Goal
- Claude Code と Codex の間で、ペイン分割を活かした “転送だけ自動化” を行う
- 最終承認は人間の `y` 入力で残す
- 転送経路は “ファイル郵便受け（SSOT）” とし、転記ミスと手作業を削減する

## Non-goals
- 無人実行（自動承認）
- ペイン内容の取得（スクレイピング）
- secrets/keys/tokens の取り扱い
- アプリ機能の変更（apps/ packages/ の仕様改修）

## Concept
### SSOT（郵便受けファイル）
- `.ai/handoff/to_codex.txt`: Claude → Codex に送る最終プロンプト
- `.ai/handoff/to_claude.txt`: Codex → Claude に返す要約/引継ぎ/結果

WezTerm は配送係であり、真実（SSOT）はファイルに置く。

### 安全性
- 送信前にプレビューを表示する
- `y` 以外は送信しない
- 危険語（破壊的コマンド、強制 push、外部アクセス）検知で送信停止
- サイズ上限で誤爆を減らす

## Acceptance Criteria
### A. 送信スクリプト
- `scripts/wez/send-handoff.sh` が存在し、以下を満たす
  - `--to codex|claude` と `--file path` を受け取る
  - `WEZ_PANE_CODEX` / `WEZ_PANE_CLAUDE` を参照し、送信先 pane_id を切り替える
  - 送信前にプレビュー（先頭N行 + サイズ）を出す
  - `y` のときのみ `wezterm cli send-text` を実行する
  - 危険語検知にヒットしたら送信せず終了する
  - 送信データ末尾に改行を1つ足す（貼り付け後の操作性のため）

### B. ディレクトリと git 管理
- `.ai/handoff/` が存在する（ディレクトリは git 管理に残す）
- `.ai/handoff/*.txt` は原則 git 管理しない（.gitignore で無視）
- ディレクトリ維持のために `.ai/handoff/.gitkeep` などを置く（どちらでもよい）

### C. ドキュメント
- `docs/runbook/wezterm-handoff-claude-codex.md` を追加し、以下を含む
  - pane_id の取得（`wezterm cli list`）
  - 環境変数のセット例
  - Claude→Codex / Codex→Claude の手順
  - 事故防止（危険語検知、y 承認、サイズ上限）

### D. 証拠
- `make verify` 成功
- `make evidence` 成功（`out/evidence/*.log` 生成）
- 引継ぎ4点が揃う（spec / 変更ファイル一覧 / SHA / evidenceログ名）

## Implementation Plan
1. `.ai/handoff/` を作成し、`.gitignore` に `/.ai/handoff/*.txt` を追加（ディレクトリは残す）
2. `scripts/wez/send-handoff.sh` を追加
   - preview + y 承認 + send-text
   - 危険語検知（最低限）
   - サイズ上限（例: 100KB）
3. `docs/runbook/wezterm-handoff-claude-codex.md` を追加
4. （任意）Makefile にショートカット（`make handoff:to-codex FILE=...` 等）
5. `make verify` / `make evidence` / 引継ぎ4点

## Notes
- “出力の自動取得” は別 Issue。CLI の非対話出力が整ってから検討する。
