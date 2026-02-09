<!-- docs/specs/active/2026-02-09-issue-TBD-task-screen-advanced-mode-prune-and-keep-core.md -->

# Spec: 課題画面の上級者モードを整理し、正の導線（Run→全テスト→結果）に揃える

- Issue: TBD  
- Updated: 2026-02-09  
- Owner: TBD  
- Status: active  
- Related: docs/specs/active/2026-02-08-issue-66-task-screen-terminal-first.md（課題画面の整理系）  

## Goal
- 課題画面の「上級者モード」を整理し、表示構成を以下の5要素に固定する。  
  - 課題名  
  - 問題文  
  - コマンド一覧  
  - コマンドライン（実行ボタン含む）  
  - デバッグパネル  
- Runボタン押下で「複数のテストケース評価 → 結果画面へ遷移」を正として統一する。
- 上級者モードの文言を日本語のみへ統一する（英語の残骸を排除）。

## Non-goals
- DSL実行エンジン（packages/dsl-core）の仕様変更
- DBスキーマ変更 / 永続仕様変更
- 新規機能追加（演出、音、ランキング等）

## Background（思想）
- “上級者モード = 全部表示” は、デバッグには便利だが、プロダクトとしての心臓部にはノイズになる。
- モードの違いは「見える情報量/補助」にはなり得るが、「画面の種類が増える」方向は保守性を落とす。
- UNIX哲学的には、要素を小さく固定し、導線（Run→評価→結果）を一つに絞るほど誤動作と説明コストが減る。

## Acceptance Criteria
### A. 画面構成の固定
- 上級者モードの課題画面は以下のみを表示する:  
  - 課題名 / 問題文 / コマンド一覧 / コマンドライン / デバッグパネル
- 追加で増やしたデバッグ用“画面・導線”は表示しない（課題画面内に持ち込まない）。
- 初心者モードも “構成” は上級者と同一（上記5要素）である。

### B. 正の導線（Run）
- コマンドラインの Run で、複数のテストケースを評価する。
- 評価後は結果画面へ遷移する（実行導線は1本）。

### C. 日本語統一
- 上級者モードの画面文言は日本語のみ（英語の残骸が残らない）。

### D. 証拠
- `make verify` 成功
- `make evidence` 成功（`out/evidence/*.log` 生成）
- 引継ぎ4点が揃う（spec / 変更ファイル / SHA / evidenceログ名）

## NFR（4軸）
- 安全性: secrets禁止、破壊的コマンド禁止。評価処理の入力は境界で検証（既存方針維持）。
- 変更容易性: 表示構成を固定し、モード差分を局所化（provider/store/課題画面）。
- 性能: 不要画面の描画を避け、DOM/状態の複雑さを減らす。
- 運用: verify/evidence により変更の成否が追跡できる。

## 調査の当たり（候補）
- 課題画面: `apps/user/app/tasks/[taskId]/page.tsx`
- 課題ヘッダ: `apps/user/src/components/tasks/TaskHeader.tsx`
- コマンドUI: `apps/user/src/lib/command-builder/*`
- 実行導線:  
  - `apps/user/src/lib/terminal/RunToResultButton.tsx`  
  - `apps/user/src/lib/terminal/useRunToResultButton.ts`  
  - `apps/user/src/lib/terminal/evaluateClient.ts`  
  - `apps/user/src/lib/terminal/evaluateContract.ts`  
  - `apps/user/app/api/tasks/[taskId]/evaluate/route.ts`  
- 結果画面:  
  - `apps/user/app/results/running/page.tsx`  
  - `apps/user/app/results/running/ResultsRunningClient.tsx`  
  - `apps/user/app/results/[resultId]/page.tsx`  
- モード切替:  
  - `apps/user/src/components/providers/ui-mode-provider.tsx`  
  - `apps/user/src/lib/ui-mode/uiModeStore.ts`  
- デバッグ:  
  - `apps/user/src/components/debug/DebugPanel.tsx`  
  - `apps/user/src/components/providers/DebugPanelGate.tsx`  
  - `docs/runbook/debug-panel.md`  

## Implementation Plan（段階的）
### Phase 0: 現状把握（読む範囲を絞る）
- 上級者モードで「増えてしまった表示要素」がどこから出ているかを列挙  
  - 課題画面直下か、layout/provider 経由か  
- 英語文言が残っている箇所を `rg` で特定

### Phase 1: 画面構成の固定（見えるものを5要素に）
- 課題画面の JSX 構造を整理し、上級者モードでも 5要素のみを描画
- “デバッグ用に増やした画面/導線” の描画条件を削除（DOMに出さない）
- デバッグパネルは残す（DebugPanelGate / DebugPanel）

### Phase 2: Run導線の統一（評価→結果）
- Runボタンの実行が「複数テストケース評価→結果画面遷移」になっているか確認
- もし“単発評価”や“別ページ表示”が残っていれば、正の導線へ寄せる  
  - API契約（evaluateContract）とUI（RunToResultButton）を中心に修正  
- 既存E2E（pseudo-terminal/spec等）を壊さない

### Phase 3: 日本語統一（文言の掃除）
- 課題画面関連の英語文言を日本語へ（上級者モードの表示領域に限定）
- 文字列の管理方針は最小で（まず直書きの残骸を潰す）。i18n導入は別issue。

### Phase 4: 検証と証拠
- `make verify`
- `make evidence`
- 引継ぎ4点を Issue に残す

## Test Plan
- 手動確認:  
  - 初心者/上級者それぞれで課題画面が同一構成（5要素）  
  - Run→結果画面遷移（複数テストケース評価）  
  - 英語文言が出ない  
- 自動:  
  - `make verify`  
  - `make evidence`  
