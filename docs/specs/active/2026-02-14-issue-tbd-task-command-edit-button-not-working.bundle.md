<!-- docs/specs/active/2026-02-14-issue-tbd-task-command-edit-button-not-working.md -->

# Spec: 課題画面で選択中コマンドの編集ボタンが動作しない

- Issue: TBD（関連: https://github.com/chapy0706/czz/issues/66）
- Owner: TBD
- Status: draft
- Updated: 2026-02-14

## Context（背景 / 現状）
課題画面（/tasks/[taskId]）でコマンドを選択すると、選択中コマンドのパネルに「編集」ボタンが表示されるが、クリックしても何も起きず編集できない。

課題画面はアプリの心臓部であり、ここが壊れると学習体験（コマンド構築 → 実行 → 結果）全体が止まる。

## Goal（勝利条件）
- 選択中コマンドの「編集」ボタンを押すと、該当コマンドの編集UI（例: CommandEditorSheet など）が確実に開く
- 編集内容を保存すると、パイプラインの表示と実行に反映される
- 初心者/上級者モードの両方で同様に動作する

## Non-goals（やらないこと）
- コマンド仕様やDSLの変更
- パイプライン表示のデザイン刷新
- 既存の実行・結果導線（Run → resultId 抽出 → /results/[resultId]）の変更

## Problem Statement（問題の定義）
- 現象: 編集ボタンが存在するのに、押しても何も起きない（モーダル/シートが開かない、フォーカス移動もしない、状態が変わらない）
- 期待: 選択中のコマンドを編集できる導線が機能する

## Repro Steps（再現手順）
1. 課題画面 /tasks/[taskId] を開く
2. パレット/リストからコマンドを選択し、選択中コマンドのパネルを表示する
3. パネル内の「編集」ボタンを押す

## Expected / Actual（期待結果 / 実際）
- Expected: 編集UIが開き、対象コマンドの現在値が表示され、編集して保存できる
- Actual: 何も起きない（編集UIが開かない）

## Acceptance Criteria（受け入れ条件）
- 編集ボタン押下で編集UIが開く（PC/スマホ、クリック/タップ）
- 編集UIで変更した値が、選択中コマンドパネルとパイプライン表示に即時反映される
- 編集UIを閉じた後も、選択状態が維持される
- 初心者モード/上級者モードで動作する
- `make verify` が成功する
- `make evidence` が成功し、ログが out/evidence に残る
- 回帰防止として Playwright の既存テストに1本追加（もしくは既存テストへ追記）される

## Investigation（当たり / 調査観点）
以下の観点を優先して調べる。

### 1) UIイベントが発火しているか
- onClick が未接続、または no-op になっていないか
- button が disabled 扱いになっていないか（条件式、aria-disabled、pointer-events、z-index）
- overlay（初心者HUDや別レイヤー）がクリックを吸っていないか

### 2) 状態（store）が編集対象を持っているか
- 選択中コマンドIDが store に入っているか
- 「編集開始」アクションが store に存在し、編集UI表示フラグが立つか
- command の参照が古い（stale）/ null になっていないか

### 3) 編集UI（sheet/dialog）がレンダリングされているか
- CommandEditorSheet がどこで mount されているか（CommandBuilder内、PipelinePanel内など）
- open state の受け渡しが途切れていないか

## Candidate Files（変更候補）
最小touchで直す。範囲はまずここ。

- apps/user/src/lib/command-builder/CommandBuilder.tsx
- apps/user/src/lib/command-builder/PipelinePanel.tsx
- apps/user/src/lib/command-builder/CommandRow.tsx
- apps/user/src/lib/command-builder/CommandEditorSheet.tsx
- apps/user/src/lib/command-builder/commandBuilderStore.ts

回帰防止（E2E）
- e2e/tests/pipeline-panel.spec.ts
  または
- e2e/tests/command-builder-params.spec.ts

## Implementation Plan（実装計画）
1. 現象再現（ローカル）
   - 課題画面で編集ボタン押下 → 何も起きないことを確認
2. クリックイベントの追跡
   - 編集ボタン要素を特定し、onClick からどの関数へ流れるはずかを追う
   - store の状態遷移（編集対象ID/openフラグ）が変化しているか確認
3. 修正
   - onClick 未接続なら接続する
   - open state の受け渡しが分断されているなら、CommandBuilder（または一箇所）に集約して props 経由で渡す
   - overlay がクリックを吸っているなら、レイヤー/ポインターイベントを最小変更で調整
4. E2E 追加
   - 「コマンド選択 → 編集ボタン → 編集UIが開く → 値を変更 → 保存 → パネルに反映」を1シナリオで検証
5. Quality Gate
   - `make verify`
   - `make evidence`

## Test Plan（テスト計画）
- 手動
  - PC/スマホ相当で、編集ボタンのクリック/タップで編集UIが開く
  - 値変更後、表示と実行に反映される
  - 初心者/上級者モードで同様に動く
- 自動（Playwright）
  - edit を起点にパネル反映までを検証

## Claude Code Run（このspecを回す手順）
- Plan（read-only）: /codex spec=docs/specs/active/2026-02-14-issue-tbd-task-command-edit-button-not-working.md
- Codex用プロンプト生成: /claude-codex-workflow spec=docs/specs/active/2026-02-14-issue-tbd-task-command-edit-button-not-working.md mode=normal

## Risks / Notes（リスク / 注意）
- 課題画面は心臓部なので、無関係なUIのリファクタはしない
- store まわりの変更は影響が広がりやすい。変更点は最小にする
- 外部アクセス禁止、secrets を読まない


<!-- docs/issues/2026-02-14-issue-tbd-task-command-edit-button-not-working.md -->

# Issue: 課題画面で選択中コマンドの編集ボタンが動作しない

- Issue: TBD
- Spec: docs/specs/active/2026-02-14-issue-tbd-task-command-edit-button-not-working.md
- Status: draft
- Updated: 2026-02-14

## Context（背景 / 現状）
課題画面（/tasks/[taskId]）でコマンド選択後に表示される「選択中コマンドパネル」の編集ボタンが反応せず、編集UIが開かない。

## Goal（勝利条件）
- 編集ボタン押下で編集UIが開く
- 編集結果がパネル表示・パイプライン表示・実行に反映される
- 初心者/上級者モードで動作する

## Non-goals（やらないこと）
- DSL/コマンド仕様の変更
- UIの大規模リファクタ

## Scope（Do / Don’t）
### Do（このIssueでやる）
- 編集ボタンが動作しない原因特定と修正
- 回帰防止のE2E（Playwright）を1本追加（または既存へ追記）

### Don’t（このIssueではやらない）
- パイプライン全体のUI刷新
- 実行/結果導線の仕様変更

## Spec（Single Source of Truth）
- docs/specs/active/2026-02-14-issue-tbd-task-command-edit-button-not-working.md

## Evidence（証拠）
- make verify
- make evidence（out/evidence にログ保存）

## DoD（Definition of Done）
- spec の Acceptance Criteria を満たす
- make verify / make evidence が成功する
- 引継ぎ4点（spec/差分/sha/log）が揃う
- 機密情報が repo に含まれない
