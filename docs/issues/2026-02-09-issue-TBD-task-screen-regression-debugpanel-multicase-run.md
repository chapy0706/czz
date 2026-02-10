<!-- docs/issues/2026-02-09-issue-TBD-task-screen-regression-debugpanel-multicase-run.md -->

# Issue: 課題画面リファクタ後の回帰修正（DebugPanel 復帰 + Run の複数テストケース評価を正へ）

- Issue: TBD
- Spec: docs/specs/active/2026-02-09-issue-TBD-task-screen-regression-debugpanel-multicase-run.md
- Status: draft
- Owner: TBD
- Updated: 2026-02-09

## 背景 / 現状
直近の課題画面整理（上級者モードの要素固定）対応は AC を満たし、`make verify` / `make evidence` も成功した。
しかし、実機/画面確認の段階で以下の回帰が見つかった。

- DebugPanel が表示されなくなった（上級者モードでの想定表示が消失）
- コマンドラインの Run の結果が「複数テストケース評価→結果画面遷移」という正の仕様になっていない疑い

## 目的（Why）
- 課題画面の“心臓部”の運用を崩さない（デバッグ観測点 + 正の実行導線の保証）
- 直近整理で混入した回帰を最小修正で戻す
- 今後の ADD/SDD 運用で、UI整理と評価導線が分離して壊れないようにする

## スコープ（Do）
- DebugPanel の表示復帰（上級者モードで表示される前提に戻す）
- Run ボタンの挙動を「複数テストケース評価→結果画面遷移」に確実にする
- 日本語文言統一は維持（英語の再混入を防ぐ）

## スコープ（Don’t）
- packages/dsl-core の仕様変更
- DBスキーマ変更
- 新規機能追加（演出、音、ランキング等）
- DebugPanel の設計変更（表示条件の修正に留める）

## 受け入れ条件（Definition of Done）
- 上級者モードで DebugPanel が表示される（少なくとも従来の表示条件相当）
- Run 押下で複数テストケース評価が走り、結果画面へ遷移する（正の導線1本）
- `make verify` が成功する
- `make evidence` が成功し、`out/evidence/*.log` が生成される
- 引継ぎ4点（specパス / 変更ファイル一覧 / SHA / evidenceログ名）が揃う

## 調査の当たり（候補）
- 課題画面: `apps/user/app/tasks/[taskId]/page.tsx`
- DebugPanel 表示制御: `apps/user/src/components/providers/DebugPanelGate.tsx`, `apps/user/src/components/debug/*`
- UIモード: `apps/user/src/components/providers/ui-mode-provider.tsx`, `apps/user/src/lib/ui-mode/uiModeStore.ts`
- Run→結果導線:
  - `apps/user/src/lib/terminal/useRunToResultButton.ts`
  - `apps/user/src/lib/terminal/RunToResultButton.tsx`
  - `apps/user/src/lib/terminal/evaluateClient.ts`
  - `apps/user/src/lib/terminal/evaluateContract.ts`
  - `apps/user/app/api/tasks/[taskId]/evaluate/route.ts`
- 結果画面: `apps/user/app/results/running/*`, `apps/user/app/results/[resultId]/page.tsx`

## 検証
- 上級者モードで DebugPanel が見える
- Run → 結果画面遷移（複数テストケース）
- `make verify`
- `make evidence`
