<!-- docs/specs/active/2026-02-09-issue-TBD-task-screen-playground-panel-dryrun.md -->

# Spec: Debugパネルを「プレイグラウンド（dry-run）」にして課題画面内で完結させる（#57準拠）

- SSOT: GitHub Issue #57
- Status: active
- Updated: 2026-02-11

## Goal
- Debugパネル（ユーザー向け）を「プレイグラウンド」として再定義し、課題画面内で完結させる。
- プレイグラウンド実行は dry-run（非永続・非遷移）で、結果を課題画面内に表示する。
- 入力は選択式で安全にし、出力は人間可読に整形する。
- 正規 Run（複数テスト評価 → 結果画面遷移）を壊さない。
- 実行結果の **成功/失敗を一目で判定できる** 表示を用意する（JSON 生表示に頼らない）。

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
- 成功/失敗:
  - 成功: 評価処理がエラーなく完了し、出力（output）が取得できた状態
  - 失敗: ネットワーク/契約違反/評価例外などにより出力が取得できない、または評価結果が失敗状態のもの

## Acceptance Criteria
### A. 入力（自由入力禁止の選択式）
- 自由入力欄が存在しない
- プリセット + 長さ/値域 + オプションの組み合わせで input を生成
- 当面の入力は number[]（1次元）

### B. 実行（dry-run）
- 結果画面へ遷移しない
- results 保存が発生しない
- 課題画面内に出力が表示される

### C. 表示（人間可読、JSON 非表示）
- JSON 生表示しない（成功時/失敗時ともに）
- 実行後に以下 3 点が表示される
  1) 選択した input（数列 `1, 2, 3` 表記）
  2) 選択中のコマンド列（UI 順で、人が読める表現）
  3) 実行後の output（可能なら数列、不可なら「表示できない形式」などの安全なフォールバック）
- 失敗は「要約 + 詳細折りたたみ」
  - 要約: 短い日本語（例: 「実行に失敗しました」）
  - 詳細: 開発者向けではなく、ユーザーに必要な情報に絞る（例: 「入力が不正」「通信に失敗」など）
- 初心者モードは追加説明の拡張点を持つ（擬似算数、before/after 等）

### D. 成功/失敗の視認性（追加）
- 実行結果の成功/失敗が、JSON を見なくても判定できる
- 表示要件
  - 成功時: 「成功」相当の短い文言（日本語）と、出力が表示される
  - 失敗時: 「失敗」相当の短い文言（日本語）と、要約 + 詳細（折りたたみ）が表示される
- 「success」という英語や、JSON の `status` 表示に依存しない

### E. 正規 Run を壊さない
- 正規 Run（複数テスト評価→結果画面遷移）が維持される

### F. 証拠
- make verify / make evidence 成功
- 引継ぎ4点（spec / 変更ファイル / SHA / evidenceログ）

## Implementation Notes
- 評価ロジックは既存資産を優先して再利用（DSLコア / evaluate API / evaluateClient）。
- 追加するなら `dryRun` フラグ等で「保存・遷移」を確実に遮断する。
- 成功/失敗の判定は「API の返却契約」に従い、UI 層で表示する（成功でも JSON は出さない）。
- 出力整形は共通ユーティリティ化し、Debug/結果画面で同じ表現を使える方向へ寄せる。

## Phased Plan
- Phase 1: プレイグラウンド枠 + 入力生成（選択式・自由入力なし）
- Phase 2: dry-run 実行（保存/遷移なし）+ 画面内出力
- Phase 3: 表示刷新（input / commands / output、成功/失敗の視認性、JSON 非表示）
- Phase 4: 出力整形の共通化 + 初心者向け拡張点（対象コマンドは絞る）
- Phase 5: verify/evidence + 引継ぎ4点

## Codex Prompt（minimum）
spec: docs/specs/active/2026-02-09-issue-TBD-task-screen-playground-panel-dryrun.md

do:
- #57 の方針に従い、プレイグラウンド（dry-run）を課題画面内で完結させる（保存なし/遷移なし）
- 入力は選択式（自由入力なし）。当面 number[]（1次元）
- 実行後 UI は JSON を一切表示しない
- 実行後 UI に「input / コマンド列 / output」を表示する（人間可読）
- 成功/失敗は日本語の短文で判定できる表示にする（英語 "success" を出さない）
- 正規 Run（複数テスト評価→結果画面遷移）を壊さない
- make verify → make evidence

dont:
- dsl-core / DB スキーマ変更
- 任意文字列/CSV入力、任意オブジェクト入力
- #69 の開発者向け Debug Panel を混ぜる
- secrets/keys/tokens を扱わない
- 破壊的コマンド禁止 / git push しない

output:
- 変更ファイル一覧 / SHA / evidenceログ名
