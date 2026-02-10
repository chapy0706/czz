<!-- docs/issues/2026-02-10-issue-TBD-wezterm-handoff-claude-codex-y-approve.md -->

# Issue: WezTerm ペイン間ハンドオフ自動化（Claude Code ⇄ Codex / y 承認）

- Issue: TBD
- Spec: docs/specs/active/2026-02-10-issue-TBD-wezterm-handoff-claude-codex-y-approve.md
- Status: draft
- Owner: TBD
- Updated: 2026-02-10

## 背景 / 現状
- 既に WezTerm のペイン分割で Claude Code と Codex を並走している（運用は成立）。
- ただし、現状は「Claude の出力をコピペ → Codex」「Codex の結果をコピペ → Claude」が面倒で、転記ミスのリスクもある。
- 一方で、コマンド実行の最終承認（人間が y などで同意する）は今後も維持したい。

## 目的（Why）
- ペイン分割の強みを最大化し、コピペ作業をゼロに近づける。
- 実行の最終承認は人間が行う（y 承認）ことで、安全性を落とさずに速度だけ上げる。
- SDD/安全ガード/verify/evidence の運用哲学を崩さない。

## スコープ（Do）
- “郵便受けファイル”方式での双方向ハンドオフを導入する
  - Claude → Codex: `.ai/handoff/to_codex.txt`
  - Codex → Claude: `.ai/handoff/to_claude.txt`
- WezTerm の `wezterm cli send-text` を使い、指定 pane_id へテキストを送信する
- 送信前にプレビューを出し、`y` 入力でのみ送信する（人間の承認を残す）
- 最小の安全ガードを入れる（危険語検知で送信停止、サイズ上限など）
- 運用手順を docs に残す（runbook）

## スコープ（Don’t）
- 完全自動化（出力の自動取得や無人実行）
- 画面スクレイピングでの “ペイン内容の取得”
- アプリ機能の追加や仕様変更（apps/ packages/ の機能改修）
- secrets/keys/tokens の取り扱い

## 受け入れ条件（Definition of Done）
- `scripts/wez/send-handoff.sh` が追加されている
- `y` 承認でのみ送信され、`y` 以外はキャンセルされる
- `WEZ_PANE_CODEX` / `WEZ_PANE_CLAUDE` の指定で送信先を切り替えられる
- `.ai/handoff/to_codex.txt` と `.ai/handoff/to_claude.txt` が運用前提として明記されている（.gitkeep などでディレクトリは保持）
- 危険語検知（例: `rm -rf`, `git reset --hard`, `--force`, `curl http` 等）で送信が止まる
- docs/runbook に手順があり、WezTerm の pane_id 取得手順（`wezterm cli list`）が書かれている
- `make verify` と `make evidence` が通る（新規スクリプト/ドキュメント追加が lint の邪魔をしない）
- 引継ぎ4点（spec / 変更ファイル一覧 / SHA / evidenceログ名）が揃う

## 変更対象（候補）
- `scripts/wez/send-handoff.sh`（新規）
- `.ai/handoff/`（新規ディレクトリ。運用用ファイル置き場）
- `docs/runbook/wezterm-handoff-claude-codex.md`（新規）
- `.gitignore`（必要なら `.ai/handoff/*.txt` を無視。ただしディレクトリは残す）
- `Makefile`（任意: `make handoff:to-codex` 等のターゲット追加）

## 検証
- WezTerm で pane_id を取得し、環境変数をセット
- `.ai/handoff/to_codex.txt` を用意 → `send-handoff.sh --to codex` → `y` 承認で Codex ペインへ投入される
- `.ai/handoff/to_claude.txt` を用意 → `send-handoff.sh --to claude` → `y` 承認で Claude ペインへ投入される
- 危険語を含む場合に送信が止まる
- `make verify` / `make evidence`

## 備考
- “出力の自動取得” は Codex/Claude の CLI が非対話で stdout に出せる形が整ってから段階的に検討する。
