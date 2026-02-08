<!-- docs/specs/active/2026-02-05-issue-70-ai-orchestration-sdd-security-evidence.md -->

# Spec: Issue #70 - AI協奏 + SDD土台 + セキュアガード + 品質エビデンス

- Issue: https://github.com/chapy0706/czz/issues/70
- Related: https://github.com/chapy0706/czz/issues/67
- Status: active
- Updated: 2026-02-05

## Goal（何ができたら勝ちか）
- Claude Code / Codex の協奏運用が「ズレずに」「安全に」「低トークンで」回る
- SDD の単一の真実が `docs/specs/` に定着する
- 実装完了前に `make verify` / `make evidence` で引継ぎ用の証拠が残る
- `.claude` のルール/フックで危険操作と機密参照の事故確率を下げる

## Non-goals（やらないこと）
- アプリ機能の新規追加（UX改修・新画面・新コマンド追加など）
- 既存アーキテクチャの大規模再設計（パッケージ再編、DB全面変更など）

## Acceptance Criteria（受け入れ条件）
- `CLAUDE.md` に「Issueは入口 / specが真実 / AIはspecを読む」が明記されている
- `AGENTS.md` に Codex の実働ループ（spec→実装→make verify→make evidence）が明記されている
- `docs/specs/README.md` に Issueフォーマット（薄い入口）と spec 必須セクションが定義されている
- `.claude/settings.json` と hooks が存在し、少なくとも以下が成立する
  - 破壊的コマンド（rm -rf / reset --hard / force push 等）の実行がブロックされる
  - .env / keys / tokens / secrets へのアクセスがブロックされる
- `make verify` が品質ゲートを実行できる（現状の実装に合わせる）
- `make evidence` が `out/evidence/<timestamp>-<sha>*.log` を生成できる（out/ は git 管理外）
- docs の入口（docs/README）から spec へ辿れる
- 引継ぎ時に、spec/差分/sha/ログが揃う

## NFR（非機能要件）
### 安全性（改ざん/権限/型破綻）
- secrets は repo に入れない・読まない・ログに出さない
- hooks + 運用ルール（AGENTS/CLAUDE）で事故確率を下げる

### 変更容易性（影響範囲）
- 設定や規約は repo 直下（CLAUDE/AGENTS/docs）に置き、変更点が追いやすい
- `.claude/rules` は短いファイルに分割し、参照先を固定する

### 性能（通信/再描画/計算）
- 仕様・運用の整備が主であり、アプリ性能には影響を与えない（変更は最小）

### 運用（ログ/再現/デバッグ）
- `make evidence` により、引継ぎ前に「ゲートが通った証拠」を残す
- runbook で「証拠→仮説→実験→決定」の型を固定する

## Test Plan（証拠の取り方）
- 実行:
  - make verify
  - make evidence
- 証拠:
  - out/evidence/<timestamp>-<sha>*.log が生成される
  - git diff --name-only で変更ファイル一覧を確認できる
- 追加（任意）:
  - CI で make ci を走らせ、artifact としてログを保存する

## Risks（既知リスクと対策）
- deny/allow がツール実装に依存し、期待通りに効かない可能性
  - 対策: hooks で強制し、運用ルールも併用する
- hooks 実行環境に python3 が無い可能性
  - 対策: hooks で python3 を使う前に存在チェックし、無ければ deny する（安全側）
