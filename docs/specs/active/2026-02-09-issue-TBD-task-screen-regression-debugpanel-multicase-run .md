<!-- docs/specs/active/2026-02-09-issue-TBD-task-screen-regression-debugpanel-multicase-run.md -->

# Spec: 課題画面リファクタ後の回帰修正（DebugPanel 復帰 + 複数テストケース評価の保証）

- Issue: TBD
- Updated: 2026-02-09
- Owner: TBD
- Status: active
- Related:
  - docs/specs/active/2026-02-09-issue-TBD-task-screen-advanced-mode-prune-and-keep-core.md

## Goal
- 上級者モードで DebugPanel が表示される状態を復帰する
- Run の挙動を「複数テストケース評価 → 結果画面遷移」に確実にする
- 日本語文言統一を維持する（英語再混入を防ぐ）

## Non-goals
- packages/dsl-core の仕様変更
- DBスキーマ変更
- DebugPanel の新機能追加（ログ拡張など）

## Background（なぜ起きる）
UI整理で「表示の条件」「導線の呼び出し元」を移動/削除すると、
- 観測点（DebugPanel）が“どこから描画されていたか”が消える
- Run が「簡易実行」「dry-run」「単発評価」の枝に落ちる
という回帰が起きやすい。

このSpecは、課題画面の“正の導線”と“観測点”を再固定するための保守パッチ。

## Acceptance Criteria
### A. DebugPanel 復帰
- 上級者モードで DebugPanel が表示される
- 表示条件は「従来の gate / flag」相当を維持（恒常表示にするかは本issueでは決めない）

### B. Run の複数テストケース評価
- Run 押下で複数テストケース評価が走る
- 評価後、結果画面へ遷移する（導線1本）
- “単発評価”や“デバッグ専用導線”に落ちない

### C. 証拠
- `make verify` 成功
- `make evidence` 成功（`out/evidence/*.log` 生成）
- 引継ぎ4点が揃う（spec / 変更ファイル / SHA / evidenceログ名）

## Investigation Guide（最小の見取り図）
### 1) DebugPanel が消えた経路
- 課題画面（`apps/user/app/tasks/[taskId]/page.tsx`）から DebugPanelGate/DebugPanel が外れていないか
- DebugPanelGate が参照する条件（mode/flag/env）が意図せず false になっていないか
- DebugPanel の登録方式（registry）が「課題画面でのみ登録」になっていないか

### 2) Run が複数テストケースで動いていない経路
- Run ボタンが `useRunToResultButton` を呼んでいるか
- `evaluateTask` が呼ばれているか
- `/api/tasks/[taskId]/evaluate` が複数テストケース評価を返している契約か（contractのズレがないか）
- 結果画面遷移（`router.push`）が resultId を使っているか

## Implementation Plan（段階）
### Phase 0: 事実確認（最小）
- 上級者モードで DebugPanel が出る条件（store/flag/env）を確認
- Run の実行時に叩いている API / payload / レスポンスを確認（Networkログでも可）

### Phase 1: DebugPanel 復帰
- 課題画面 or 課題画面レイアウトの適切な位置に DebugPanelGate を復帰
- gate 条件が壊れていたら修正（ただし恒常表示化はしない）

### Phase 2: Run を正の導線へ再固定
- Run ボタンが `useRunToResultButton` 経由になるよう統一
- もし evaluate API が単発評価になっているなら「複数テストケース評価」契約へ戻す（dsl-coreは触らない）

### Phase 3: verify/evidence
- `make verify`
- `make evidence`
- 引継ぎ4点

## Touch（初期想定）
- apps/user/app/tasks/[taskId]/page.tsx
- apps/user/src/components/providers/DebugPanelGate.tsx
- apps/user/src/lib/terminal/useRunToResultButton.ts
- apps/user/app/api/tasks/[taskId]/evaluate/route.ts

（実際の最小 touch は Phase 0 の確認で確定）
