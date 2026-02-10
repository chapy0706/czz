<!-- docs/issues/2026-02-09-issue-TBD-task-screen-tryout-panel-debugpanel-and-multicase-run.md -->

# Issue: 課題画面「お試しエリア（DebugPanel）」を初心者にも表示 + Runの複数テストケース保証

- Issue: TBD
- Spec: docs/specs/active/2026-02-09-issue-TBD-task-screen-tryout-panel-debugpanel-and-multicase-run.md
- Status: draft
- Owner: TBD
- Updated: 2026-02-09

## 背景 / 現状
- 課題画面は「初心者モード / 上級者モード」で表示を切り替えている。
- 直近の整理で、課題画面から余分な導線や表示を削減したが、以下の回帰が起きた。
  - デバッグパネル（DebugPanel）が表示されない / 意図した場所にない
  - Run ボタンの実行が「複数テストケース評価 → 結果画面遷移」になっていない疑いがある

## 目的（Why）
- 初心者モードでも、品質担保のための「試せる領域」を確保する（将来テスト実装へ繋げる）。
- 正の導線を一本化し、Run 実行の結果が常に複数テストケース評価に基づくことを保証する。
- 文言は日本語に統一し、初心者にも安心な表現にする。

## スコープ（Do）
- 初心者モードにも DebugPanel 相当の領域を表示する
  - 表示名は **「お試しエリア」**
  - 内容は上級者モードの DebugPanel と **同じ**
- Run の正の導線を確認し、複数テストケース評価 → 結果画面遷移 を保証する
- 既存の SDD/安全ガード/verify/evidence 運用は崩さない

## スコープ（Don’t）
- dsl-core の仕様変更
- DB スキーマ変更
- 新規の演出/音/ランキング等の機能追加
- secrets/keys/tokens の取り扱い
- 破壊的コマンドや強制 push

## 受け入れ条件（Definition of Done）
- 初心者モードで **「お試しエリア」** が表示される
  - 見た目はパネル（Card 等）でよい
  - 中身は DebugPanel と同等（同じコンポーネントを使うか、同一の内容を共通化して表示する）
- 上級者モードでも同じ内容が表示される（名称は DebugPanel / デバッグ でもよいが、日本語）
- Run → 複数テストケース評価 → 結果画面遷移 が壊れていない（導線が1本）
- `make verify` / `make evidence` が成功し、ログが生成される
- 引継ぎ4点（spec / 変更ファイル一覧 / SHA / evidenceログ名）が揃う

## 変更対象（候補）
- `apps/user/app/tasks/[taskId]/page.tsx`
  - 初心者モードでも「お試しエリア」を出す配置（5要素の1つとして常時表示に寄せる）
- `apps/user/src/components/debug/DebugPanel.tsx` または `apps/user/src/components/providers/DebugPanelGate.tsx`
  - “dev限定/flag限定” の条件が初心者表示を阻害していないか点検
  - 将来のテスト実装のため、UIとしての入口は確保する
- `apps/user/src/lib/terminal/useRunToResultButton.ts` / `evaluateClient.ts` / `evaluateContract.ts`
  - 複数テストケース評価の契約が崩れていないか確認

## 検証
- 目視
  - 初心者モード: 課題画面に「お試しエリア」が表示され、内容が確認できる
  - 上級者モード: 同等の内容が表示される
  - Run: 結果画面に遷移し、複数テストケースの結果が表示される
- コマンド
  - `make verify`
  - `make evidence`

## 将来（メモ）
- DebugPanel（お試しエリア）は将来「品質担保のためのテストコード」実装と連動させる前提。
  - ただし本 Issue では “土台の表示と導線の保証” のみを扱う。
