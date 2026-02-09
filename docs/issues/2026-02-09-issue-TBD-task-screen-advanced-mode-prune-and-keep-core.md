<!-- docs/issues/2026-02-09-issue-TBD-task-screen-advanced-mode-prune-and-keep-core.md -->

# Issue: 課題画面（心臓部）の上級者モードを整理し、正の導線（Run→全テスト→結果）に揃える

- Issue: TBD  
- Spec: docs/specs/active/2026-02-09-issue-TBD-task-screen-advanced-mode-prune-and-keep-core.md  
- Status: draft  
- Owner: TBD  
- Updated: 2026-02-09  

## 背景 / 現状
- 課題画面は初心者モード / 上級者モードで表示を切り替えている。
- 本来の正の仕様は「コマンドを選択して実行 → 複数のテストケースを通して評価 → 結果画面へ遷移」。
- デバッグの過程で増えた画面・導線が上級者モードで“全部出し”になっており、心臓部のUXとしてノイズが増えている。
- 表示文言は日本語で統一したい。

## 目的（Why）
- 課題画面の構成要素を最小に固定し、理解・検証・保守を容易にする。
- 正の導線（Run→全テストケース→結果画面）を唯一の実行導線として成立させる。
- 上級者モードを「余計な画面の集合」ではなく「同一構成だが情報量が増える」モードへ再定義する。

## スコープ（Do）
- 上級者モードの課題画面に表示する構成を以下に固定する  
  - 課題名  
  - 問題文  
  - コマンド一覧  
  - コマンドライン（実行ボタン含む）  
  - デバッグパネル  
- Runボタン押下で「複数のテストケース評価→結果画面遷移」の流れを正として統一する。
- 上級者モードも文言は日本語のみ（英語文言が残る箇所を排除）。

## スコープ（Don’t）
- DSLの評価ロジックそのもの（packages/dsl-core）の改変（必要が出た場合は別issue）
- DBスキーマ変更やタスク/結果の永続仕様変更（必要が出た場合は別issue）
- 新規機能追加（演出/アニメ/音など）

## 受け入れ条件（Definition of Done）
- 上級者モードの課題画面が「課題名/問題文/コマンド一覧/コマンドライン/デバッグパネル」だけで構成される。
- 初心者モードと上級者モードは“構成”は同一（上記5要素）である（見せ方や補助テキストは差があってよい）。
- Runボタンで複数テストケースの評価が走り、結果画面へ遷移する（正の導線が1本）。
- 画面文言が日本語のみ（英語が残らない）。
- `make verify` が成功する。
- `make evidence` が成功し、`out/evidence/*.log` が生成される。
- 引継ぎ4点（specパス / 変更ファイル一覧 / SHA / evidenceログ名）が揃う。

## 実装メモ（当たり）
- 課題画面: `apps/user/app/tasks/[taskId]/page.tsx`
- 課題ヘッダ: `apps/user/src/components/tasks/TaskHeader.tsx`
- コマンド一覧/ビルダー: `apps/user/src/lib/command-builder/*`
- 実行〜結果導線: `apps/user/src/lib/terminal/*` と `apps/user/app/api/tasks/[taskId]/evaluate/route.ts`
- 結果画面: `apps/user/app/results/[resultId]/page.tsx`, `apps/user/app/results/running/*`
- 上級者/初心者切替: `apps/user/src/components/providers/ui-mode-provider.tsx`, `apps/user/src/lib/ui-mode/uiModeStore.ts`
- デバッグパネル: `apps/user/src/components/debug/*`, `docs/runbook/debug-panel.md`

## 検証
- 画面確認: 課題画面（上級者モード/初心者モード）と Run→結果画面
- `make verify`
- `make evidence`
- `git diff --name-only`
