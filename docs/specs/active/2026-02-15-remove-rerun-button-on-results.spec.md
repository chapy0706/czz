<!-- docs/specs/active/2026-02-15-remove-rerun-button-on-results.md -->

# Spec: 結果画面の「もう一度実行」ボタンを削除

- Status: active
- Updated: 2026-02-15
- Owner: ちゃぴぃ

## Context（背景 / 現状）

結果画面（`/results/[resultId]`）に表示されるアクションのうち、

- タスクへ戻る
- 課題一覧へ
- もう一度実行

の3つが並んでいるが、学習フローとして「もう一度実行」はノイズになりやすい。  
「タスクへ戻る」から再実行できるため、結果画面からの直接再実行導線は削除したい。

## Goal（勝利条件）

- 結果画面から「もう一度実行」ボタンが **DOMごと** 消える（見た目だけ非表示にしない）
- 「タスクへ戻る」「課題一覧へ」は従来通り動作する
- 初心者モード/上級者モードのどちらでも、結果画面に再実行ボタンが出ない

## Non-goals（やらないこと）

- 実行ロジック（評価UseCase/DSL core/runner）への変更
- 結果の保存仕様、API、DB schema の変更
- UI全体の再レイアウト（必要最小限の余白調整はOK）

## Affected Areas（当たり候補）

tree から見ると結果画面はここが本命:

- `apps/user/app/results/[resultId]/page.tsx`

ただし、ボタン群がコンポーネント化されている可能性があるので、次も探索対象:

- `apps/user/src/lib/terminal/ResultPanel.tsx`
- `apps/user/src/lib/terminal/RunToResultButton.tsx`
- `apps/user/src/components/ui/SfxButton.tsx`
- `apps/user/src/components/ui/SfxLink.tsx`

探索は文字列起点が速い:

- `rg -n "もう一度実行|再実行|Run again|run again" apps/user`

## Acceptance Criteria（受け入れ条件）

1. `apps/user/app/results/[resultId]` の画面上に「もう一度実行」が表示されない  
2. ブラウザのHTML（Elements）上にも該当ボタン要素が存在しない（DOM非生成）  
3. 「タスクへ戻る」「課題一覧へ」がクリック可能で、従来通り遷移できる  
4. 初心者モード/上級者モードの切り替え有無に関係なく 1〜3 を満たす  
5. E2E / Unit / Typecheck のいずれかで「もう一度実行」に依存するテストがあれば修正され、全体の検証が通る

## Implementation Plan（最小ステップ）

1. `rg` で「もう一度実行」文字列の参照箇所を特定  
2. 結果画面のアクション群の生成箇所から「もう一度実行」導線を削除
   - 条件分岐で出し分けている場合は、分岐ごと削る（残骸の dead code を作らない）
3. 余白/並びが崩れたら、必要最小限で調整（ボタン2つでも自然に見えること）
4. 影響テストがあれば更新
   - `e2e/tests/user-flow-top-to-result.spec.ts` などを重点確認
5. `make verify` と `make evidence` で証拠ログを残す

## Test Plan（証拠の取り方）

- ローカル:
  - `make verify`
  - `make evidence`
- 手動確認:
  - 結果画面に遷移し、ボタンが2つだけであること
  - モード切替後も同様であること
