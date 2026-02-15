<!-- docs/specs/active/2026-02-15-issue-TBD-command-editor-range-fixed-all-input.md -->

# Spec: Command Editor の「範囲指定」を固定（常に input 全件）し、編集UIから削除（初心者/上級者）

- Issue: TBD
- Status: draft
- Updated: 2026-02-15

## Context（背景 / 現状）

コマンドを選択して「編集」を押すと、パラメータ入力欄として「範囲指定（どの範囲？）」に相当する項目が表示される。

今回の学習向けタスクでは、範囲指定は本質ではなくノイズになっている。入力データ（テストデータ input）は常に全件を対象にする前提で十分なので、ユーザーに範囲を選ばせたくない。

現状の `CommandEditorSheet.tsx` は `commandCatalog` の `params` をそのままフォーム化しており、初心者/上級者どちらのモードでも同じ項目が出る（上級者は Advanced(JSON) 編集も可能）。

## Goal（目的）

- コマンド編集UIから「範囲指定」に関する入力欄を表示しない（初心者/上級者の両方）
- 保存時には範囲が必ず「input 全件」に固定される
- Advanced(JSON) で保存した場合も同様に範囲は固定される

## Non-goals（やらないこと）

- 実行エンジンの仕様変更（範囲という概念の削除、機能の廃止）
- UI 全体のリデザイン（見た目の統一、レイアウト刷新など）
- 既存の DSL / task 定義の破壊的変更

## Desired Behavior（期待する挙動）

### 編集UI（Basic）

- `commandCatalog` に「範囲指定」param が存在しても、編集UIでは入力欄を出さない
- ユーザーが何も入力せずに保存しても、保存後のコマンドには「input 全件」が適用される

### 編集UI（Advanced(JSON)）

- Advanced(JSON) のテキストエリア上でも、範囲指定をユーザーに意識させない
  - 表示する JSON から該当キーを除外する（または、編集できない扱いにする）
- ただし保存時は必ず「input 全件」が適用される（ユーザーが JSON で範囲指定を書いても上書き）

## Approach（実装方針）

### 方針概要

- `commandCatalog` の param 定義に「エディタ表示/固定値」の UI ヒントを追加する
- `CommandEditorSheet.tsx` 側で、そのヒントに従い
  - Basic入力欄から除外
  - 保存時に固定値を強制適用（schema で parse して安全に確定）
  - Advanced(JSON) の表示時にも除外（ノイズを見せない）

### 追加する UI ヒント（案）

`commandCatalog` の param に以下を追加（型を拡張）:

- `ui.hideInEditor?: boolean`
- `ui.fixedValueInEditor?: unknown`

これにより、今回の範囲指定だけでなく、将来「学習用にノイズを隠したい param」が増えても同じ仕組みで処理できる。

### 「範囲指定」param の特定

`commandCatalog` で、以下いずれかに該当する param を対象にする。

- `key` が `range` / `scope` / `rows` など、範囲を表す名称
- `label` / `beginnerLabel` に「範囲」「範囲指定」等が含まれる
- placeholder / help に「from/to」「開始/終了」等が含まれる

対象が複数ある場合は「範囲指定系はすべて固定・非表示」にする（学習向けのノイズを確実に消す）。

### 「input 全件」固定値

固定値の表現は、既存の schema に完全一致させる。

- 例: `"all"` / `{ kind: "all" }` / `{ source: "input", mode: "all" }` など
- 重要: `CommandEditorSheet.tsx` 側で固定値を `p.schema.safeParse()` してから保存する（型破綻防止）

## Touch Points（変更対象候補）

- `apps/user/src/lib/command-builder/CommandEditorSheet.tsx`
  - Basic入力欄生成、保存処理、Advanced(JSON) の初期表示
- `apps/user/src/lib/command-builder/commandCatalog.ts`（実体のファイル名は `getCatalogItem` の定義元）
  - param 型拡張
  - 「範囲指定」param に `ui.hideInEditor` と `ui.fixedValueInEditor` を付与

## Implementation Plan（最小ステップ）

1. `commandCatalog` 側
   - param 定義型に `ui?: { hideInEditor?: boolean; fixedValueInEditor?: unknown }` を追加
   - 「範囲指定」param を特定し、`hideInEditor: true` と `fixedValueInEditor: <input全件>` を設定

2. `CommandEditorSheet.tsx` 側
   - `ui.hideInEditor` が true の param は Basic 入力欄から除外
   - 保存時（Basic/Advancedの両方）に、`ui.fixedValueInEditor` がある param を必ず適用
     - `p.schema.safeParse(fixed)` 成功時のみ保存
     - required なのに fixed が無い場合はエラー
   - Advanced(JSON) の初期表示用 JSON は、`hideInEditor` param のキーを除外して表示

3. 影響確認
   - 既存のコマンド編集が壊れていないこと
   - 既存の saved command が range を持っていても動くこと

## Acceptance Criteria（受け入れ条件）

- 初心者モードでコマンド編集を開いても「範囲指定」入力欄が表示されない
- 上級者モードでも同様に「範囲指定」入力欄が表示されない
- 上級者モードの Advanced(JSON) を使って保存しても、範囲は常に「input 全件」に固定される
- `make verify` が成功する
- `make evidence` が成功し、ログが `out/evidence/` に出る

## Test Plan（テスト計画）

- 手動（最低限）
  - 初心者モード: 任意コマンドを選択→編集→「範囲指定」が見えない→保存→結果が変わらず動く
  - 上級者モード: Basic/Advanced(JSON) 両方で「範囲指定」が入力不要になっている→保存→結果が動く

- 自動（可能なら）
  - `CommandEditorSheet` のレンダリングテスト（Testing Library がある場合）
    - `hideInEditor` param が入力欄に出ないこと
    - onSave の payload に固定値が入ること

## Notes（運用メモ）

- 今回は「学習向けのノイズ排除」目的だが、仕組みは汎用にしておく（hide/fix を他 param にも使える）。
- 固定値は schema に完全一致させる（ここがズレると保存時に弾ける）。


<!-- docs/issues/2026-02-15-issue-TBD-command-editor-range-fixed-all-input.md -->

# Issue: Command Editor の「範囲指定」を固定（常に input 全件）し、編集UIから削除（初心者/上級者）

- Issue: TBD
- Spec: docs/specs/active/2026-02-15-issue-TBD-command-editor-range-fixed-all-input.md
- Status: draft
- Updated: 2026-02-15

## Context（背景 / 現状）

コマンド編集UIで「範囲指定」入力が出ており、学習向けタスクではノイズになっている。

## Goal（勝利条件）

- 初心者/上級者の両モードで「範囲指定」入力欄が表示されない
- 保存時の範囲は常に「input 全件」に固定される（Advanced(JSON) も含む）

## Non-goals（やらないこと）

- 実行エンジンの機能廃止や仕様変更
- UI の大幅リデザイン

## Scope（Do / Don’t）

### Do（このIssueでやる）

- `commandCatalog` に editor UI ヒント（hide/fix）を追加
- 「範囲指定」param を editor から除外し、固定値（input 全件）を保存時に適用
- `CommandEditorSheet.tsx` の Basic / Advanced(JSON) 両方で固定が効くようにする

### Don’t（このIssueではやらない）

- 他の param（列指定など）の設計見直し
- DSL schema の破壊的変更

## Spec（Single Source of Truth）

- docs/specs/active/2026-02-15-issue-TBD-command-editor-range-fixed-all-input.md

## Evidence（証拠）

- make verify
- make evidence

## DoD（Definition of Done）

- spec の Acceptance Criteria を満たす
- make verify / evidence が成功
- 引継ぎ4点（spec/差分/sha/log）が揃う
- 機密情報が repo に含まれない


<!-- docs/prompts/2026-02-15-issue-TBD-command-editor-range-fixed-all-input.md -->

# Claude Code 実行プロンプト（コピペ用）

## Step 1: Plan（read-only）

/codex spec=docs/specs/active/2026-02-15-issue-TBD-command-editor-range-fixed-all-input.md

## Step 2: Codex 実装プロンプト生成

/claude-codex-workflow spec=docs/specs/active/2026-02-15-issue-TBD-command-editor-range-fixed-all-input.md mode=normal

## 実装時の注意（Codex に渡すべき制約）

- 触ってよい範囲: `apps/user/src/lib/command-builder/**`
- `.env*` や secrets を読まない/出さない/コミットしない
- 破壊的コマンド禁止（rm -rf / reset --hard / force push など）
- 最後に `make verify` と `make evidence` を必ず実行し、引継ぎ4点を提示する
