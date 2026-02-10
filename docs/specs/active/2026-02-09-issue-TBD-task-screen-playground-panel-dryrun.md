<!-- docs/specs/active/2026-02-09-issue-TBD-task-screen-playground-panel-dryrun.md -->

# Spec: Debugパネルを「プレイグラウンド（dry-run）」にして課題画面内で完結させる（#57準拠）

- SSOT: GitHub Issue #57
- Status: active
- Updated: 2026-02-10

## Goal
- Debugパネル（ユーザー向け）を「プレイグラウンド」として再定義し、課題画面内で完結させる。
- プレイグラウンド実行は dry-run（非永続・非遷移）で、結果を課題画面内に表示する。
- 入力は選択式で安全にし、出力は人間可読に整形する。
- 正規 Run（複数テスト評価 → 結果画面遷移）を壊さない。

## Non-goals
- dsl-core 変更
- DB スキーマ変更
- 任意文字列/CSV入力の導入
- 任意オブジェクト/ネスト入力
- 全コマンドの算数表現化
- #69 の開発者向け Debug Panel をこのUIに混ぜる

## Definitions
- プレイグラウンド（dry-run）: 保存しない / 遷移しない / 課題画面内に出す
- 正規 Run: 複数テスト評価 → 結果画面遷移（従来の正）

## Acceptance Criteria
### A. 入力（自由入力禁止の選択式）
- 自由入力欄が存在しない
- プリセット + 長さ/値域 + オプションの組み合わせで input を生成
- 当面の入力は number[]（1次元）

### B. 実行（dry-run）
- 結果画面へ遷移しない
- results 保存が発生しない
- 課題画面内に出力が表示される

### C. 表示（人間可読）
- JSON 生表示しない
- 数列は `1, 2, 3` 表記
- 失敗は「要約 + 詳細折りたたみ」
- 初心者モードは追加説明の拡張点を持つ（擬似算数、before/after 等）

### D. 正規 Run を壊さない
- 正規 Run（複数テスト評価→結果画面遷移）が維持される

### E. 証拠
- make verify / make evidence 成功
- 引継ぎ4点（spec / 変更ファイル / SHA / evidenceログ）

## Implementation Notes
- 評価ロジックは既存資産を優先して再利用（DSLコア / evaluate API / evaluateClient）。
- 追加するなら `dryRun` フラグ等で「保存・遷移」を確実に遮断する。
- 出力整形は共通ユーティリティ化し、Debug/結果画面で同じ表現を使える方向へ寄せる。

## Phased Plan
- Phase 1: プレイグラウンド枠 + 入力生成（選択式・自由入力なし）
- Phase 2: dry-run 実行（保存/遷移なし）+ 画面内出力
- Phase 3: 出力整形 + 初心者向け拡張点（対象コマンドは絞る）
- Phase 4: verify/evidence + 引継ぎ4点

## Codex Prompt（minimum）
spec: docs/specs/active/2026-02-09-issue-TBD-task-screen-playground-panel-dryrun.md

do:
- #57 の方針に従い、Debugパネルを「プレイグラウンド（dry-run）」として課題画面内で完結させる
- 入力は選択式（自由入力なし）。当面 number[]（1次元）
- dry-run は results 保存なし・結果画面遷移なし・課題画面内に出力表示
- 出力は JSON 生表示禁止。数列整形 + 失敗は要約+詳細折りたたみ
- 正規 Run（複数テスト評価→結果画面遷移）を壊さない
- make verify → make evidence

dont:
- dsl-core / DB スキーマ変更
- 任意文字列/CSV入力、任意オブジェクト入力
- #69 の開発者向け Debug Panel をこのUIに混ぜる
- secrets/keys/tokens を扱わない
- 破壊的コマンド禁止 / git push しない

output:
- 変更ファイル一覧 / SHA / evidenceログ名
