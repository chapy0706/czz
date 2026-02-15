<!-- docs/issues/issue-remove-legacy-debug-panel.md -->

# Issue: 旧 DebugPannel（旧デバッグパネル）削除と参照整理（安全確認付き）

## 背景
デバッグパネル導入の試行錯誤の過程で、旧実装（例: `DebugPannel` / `DebugPanel` の初期版）が残っている可能性がある。
現在は新しい実装（または別のデバッグ方針）に寄せるため、旧実装を削除してノイズと事故要因を減らしたい。

> 目的は「削除」だけでなく、**削除しても壊れないことの確認**をセットで行う。

## ゴール（Acceptance Criteria）
- 旧 DebugPannel（旧デバッグパネル）関連のファイルがリポジトリから削除される
- 参照（import / export / layout差し込み / provider差し込み / env参照）が全て解消される
- `pnpm -w typecheck` / `pnpm -w lint` / `pnpm -w test`（可能な範囲）/ `pnpm -C apps/user build` が通る
- 画面表示の hydration / infinite loop 系のエラーが再発しない
- 代替（新デバッグパネル or デバッグ無し）が意図通りになっている

## 対象（削除候補の洗い出し）
以下のいずれかに該当する「旧実装」を削除対象とする。

### 1) ファイル名・ディレクトリ
- `DebugPannel.tsx`（Pannel表記のもの）
- 旧 `DebugPanel.tsx` / `DebugPanelGate.tsx`（設計更新前のもの）
- 旧 `debugRegistry.ts`（無限更新/SSR mismatch を起こしていた世代）
- `components/debug/*` のうち、現行採用していないもの

### 2) 参照箇所（差し込み）
- `apps/user/app/layout.tsx`（`<DebugPanelGate />` などの差し込み）
- `apps/user/src/components/providers/*`（providers 集約ファイル）
- `apps/user/src/lib/**` からの import（Runner/Panel への診断差し込み）
- `.env*` の `NEXT_PUBLIC_DEBUG_PANEL` を参照している箇所

## 実施手順（Claude Code）
### Step 0: 現状の実体確認（削除前）
- `rg -n "DebugPannel|DebugPanelGate|DebugPanel|debugRegistry|NEXT_PUBLIC_DEBUG_PANEL" apps/user packages`
- `fd -a "DebugPannel|DebugPanel|DebugPanelGate|debugRegistry" apps/user`
- `pnpm -C apps/user build` が通るかを記録（通らない場合は「現状の失敗理由」をメモ）

### Step 1: 「旧実装」判定
- 旧実装かどうかは以下で判定
  - hydration / useSyncExternalStore snapshot / maximum update depth の原因になった世代
  - すでに新実装へ置換済みで、参照されていない（or 置換予定で参照を切る）
- 判定が難しい場合は、**削除ではなく `deprecated` コメント＋未参照化**を先に行う

### Step 2: 削除（または無効化）と参照整理
- 削除する場合
  - ファイル削除
  - import 参照の削除（layout / providers / components）
  - env 参照の削除（不要な `NEXT_PUBLIC_DEBUG_PANEL` の読み取り）
- 一時的に残す場合（安全策）
  - `deprecated` コメント追加
  - 参照を完全に切る（どこからも import しない状態にする）

### Step 3: 動作確認（必須）
- `pnpm -w typecheck`
- `pnpm -w lint`（または `pnpm -w check`）
- `pnpm -C apps/user build`
- `pnpm -C apps/user dev` で主要画面を軽く確認
  - `/tasks`（課題一覧）
  - 課題詳細（可能なら）
  - 結果画面（可能なら）
- ブラウザ console に hydration / infinite loop が出ないことを確認

## 注意点（安全面）
- `NEXT_PUBLIC_*` はクライアントに露出するため、秘密情報を入れない
- `.env.local` は build でも読まれるケースがあるので、デバッグ系は原則 `.env.development.local` に置く方が事故が少ない
- 旧デバッグパネルの削除は、UI・ルーティング・SSR を壊すリスクがあるため「build まで通して完了」とする

## 成果物（PRに含めるもの）
- 旧 DebugPannel 関連ファイルの削除（またはdeprecated化＋未参照化）
- 参照元の整理（layout/providers/import）
- 変更後に通ったコマンド結果（ログの抜粋でOK）
  - typecheck / lint / build

## Claude Code 実行プロンプト（そのまま貼る）
- `docs/issues/issue-remove-legacy-debug-panel.md` を読み、旧 DebugPannel（旧デバッグパネル）を安全に削除または未参照化してください。
- まず `rg` / `fd` で存在と参照箇所を特定し、旧実装かどうかを判定してください。
- 削除後は `pnpm -w typecheck` と `pnpm -C apps/user build` を必ず通してください。
- hydration / snapshot / maximum update depth の再発がないことを確認してください。
- 変更は差分ではなく、必要なファイルを適切に編集・削除してください。
