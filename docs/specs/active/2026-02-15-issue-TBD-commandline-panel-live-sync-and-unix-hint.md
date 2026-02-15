# 2026-02-15-issue-TBD-commandline-panel-live-sync-and-unix-hint

## Summary
初心者モードのコマンドライン表示が編集入力に追従せず数値が反映されない問題を解消し、
上級者モードでは実際のターミナル実行に近い（unixHint 置換）表示に揃える。

## Goals
- 初心者モードのコマンドライン表示に編集中の数値が即時反映される
- 上級者モードのコマンドライン表示が unixHint の値置換に基づく表示になる

## Non-goals
- DSL 実行ロジックの変更
- API/DB 変更
- 新規ライブラリ導入

## Acceptance Criteria
1. 初心者モードのコマンドライン（CommandBuilder のパネル表示）が、
   CommandEditorSheet の入力中に数値などのパラメータが即時反映される
2. 上級者モードのコマンドラインは commandCatalog の unixHint を用い、
   パラメータ値が置換された表示になる（実際のターミナル実行表記に近い）
3. 編集キャンセル/クローズ時はドラフト破棄され、表示は編集前の値に戻る
4. 実行・評価は確定済み commands を使い、表示だけがドラフトを反映する
5. 初心者モードのコマンドライン表示では「どの列？」の項目を表示しない

## Implementation Notes
- CommandBuilder で editingDraft を参照し、表示用のコマンド文字列を組み立てる
- unixHint の置換は PipelinePanel の実装に合わせる
- 初心者表示のパラメータ列は「どの列？」を除外する

## Test Plan
- make verify
- make evidence

## Notes
- .env/keys/tokens/secrets は扱わない
- 破壊的コマンド禁止
