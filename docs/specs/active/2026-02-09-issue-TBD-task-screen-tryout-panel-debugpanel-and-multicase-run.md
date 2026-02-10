<!-- docs/specs/active/2026-02-09-issue-TBD-task-screen-tryout-panel-debugpanel-and-multicase-run.md -->

# Spec: 課題画面「お試しエリア（DebugPanel）」を初心者にも表示 + Runの複数テストケース保証

- Issue: TBD
- Updated: 2026-02-09
- Owner: TBD
- Status: active

## Goal
- 初心者モードでも DebugPanel 相当の領域を **「お試しエリア」** として表示する（内容は上級者と同一）
- Run の正の導線（複数テストケース評価 → 結果画面遷移）を保証する
- 文言は日本語のみで統一する

## Non-goals
- dsl-core の仕様変更
- DB スキーマ変更
- 新規機能追加（演出・音・ランキング等）
- 自動承認（人間の承認は省略しない）

## Current (assumed)
- 課題画面: `apps/user/app/tasks/[taskId]/page.tsx`
- コマンド構築/実行: `apps/user/src/lib/command-builder/CommandBuilder.tsx` + `useRunToResultButton`
- DebugPanel: `apps/user/src/components/debug/DebugPanel.tsx`（または Gate 経由）

## Acceptance Criteria
### A. お試しエリア（初心者表示）
- 初心者モード時に、課題画面内へ「お試しエリア」パネルが表示される
- パネルの内容は上級者モードの DebugPanel と同等
  - 同一コンポーネントを使うか、内部実装を共通化して差分をなくす
- 表示名は「お試しエリア」（日本語）

### B. 上級者表示
- 上級者モードでも同等の内容が表示される
- 表示名は「デバッグ」等でもよいが、日本語のみ（英語残骸なし）

### C. Run の複数テストケース保証
- Run の導線が1本で、常に「複数テストケース評価 → 結果画面遷移」になる
- 単発評価/別導線（dryRun 等）が UI 上の正規導線として復活しない

### D. 証拠
- `make verify` 成功
- `make evidence` 成功（`out/evidence/*.log` 生成）
- 引継ぎ4点（spec / 変更ファイル一覧 / SHA / evidenceログ名）

## Plan (phased)
### Phase 1: 表示の復旧（A/B）
1. DebugPanel 表示のゲート条件（dev限定/flag限定）を点検
2. 初心者モードの表示名を「お試しエリア」にし、内容を上級者と同一にする
3. 課題画面上での配置を固定（表示が消えないことを優先）

### Phase 2: Run の契約確認（C）
4. `useRunToResultButton` が複数テストケース評価を前提にしているか確認
5. 結果画面で複数ケースが表示されることを目視確認

### Phase 3: Verify/Evidence（D）
6. `make verify`
7. `make evidence`
8. 引継ぎ4点の出力

## Codex Prompt (minimum)
spec: docs/specs/active/2026-02-09-issue-TBD-task-screen-tryout-panel-debugpanel-and-multicase-run.md

do:
- 初心者モードでも DebugPanel 相当を表示し、表示名を「お試しエリア」にする（内容は上級者と同一）
- Run 導線が「複数テストケース評価 → 結果画面遷移」になっていることを確認・回帰修正
- 日本語のみ（英語残骸を残さない）
- make verify → make evidence

dont:
- dsl-core / DB スキーマ変更
- 新規機能追加（演出/音/ランキング等）
- secrets/keys/tokens を扱わない
- 破壊的コマンド禁止 / git push しない

touch:
- apps/user/app/tasks/[taskId]/page.tsx
- （必要なら）apps/user/src/components/debug/DebugPanel.tsx
- （必要なら）apps/user/src/components/providers/DebugPanelGate.tsx
- （必要なら）apps/user/src/lib/terminal/useRunToResultButton.ts

output:
- 変更ファイル一覧 / SHA / evidenceログ名
