<!-- docs/specs/active/2026-02-15-issue-TBD-beginner-mascot-result-reaction.md -->

# Spec: 初心者モードのマスコットを「結果の状態」によって出し分ける

- Issue: TBD
- Status: draft
- Owner: chapy
- Updated: 2026-02-15

## Goal
初心者モードのマスコット表示を「画面状態」に応じて変えられるようにし、特に結果画面では成功/失敗に合わせて励まし・称賛を出す。

## Non-goals
- 上級者モードのUI変更
- 画像素材の追加（既存gifを使う）
- 成否判定ロジック（評価ロジック）の変更

## 用語
- マスコットパネル: 初心者モードの画面に表示される、キャラgif＋メッセージの表示領域
- variant: マスコットの「表情/状態」を表す識別子（例: studying/success/encourage）
- 成功: 結果として「全テストケースが正解」になっている状態（既存実装の成功判定に従う）
- 失敗: 結果として「どこか不正解」が含まれる状態（既存実装の失敗判定に従う）

## 仕様（振る舞い）
### デフォルト挙動（既存互換）
- 既存どおり、初心者モードの通常画面では `studying`（画像は studying.gif）を表示する。
- 既存画面の表示崩れ・文言変更が起きないように、既定値で互換を保つ。

### 結果画面（新規）
結果画面では、結果状態に応じて以下を表示する。

- 成功（全テストケース正解）:
  - 画像: `/assets/characters/indicating.gif`
  - メッセージ: `おめでとう！`

- 失敗（どこか不正解）:
  - 画像: `/assets/characters/cheering.gif`
  - メッセージ: `もう一回見直してみよう`

### 出し分け設計方針（拡張性）
- 「結果判定」は結果画面側の責務に寄せる（表示コンポーネントに評価ロジックを持ち込まない）。
- 「variant → 画像パス/文言」の対応表は一箇所に集約し、増やすだけで拡張できる形にする。
- 初心者モードだけに適用されるようにし、上級者モードには影響を与えない。

## 実装当たり（調査開始点）
最初に `studying.gif` の参照箇所を `rg` で特定し、現状の起点を確定する。

例:
- `rg -n "studying\.gif|/assets/characters/studying\.gif|beginner.*mascot" apps/user`

結果画面の候補（過去ログ上の当たり）:
- `apps/user/app/results/[resultId]/page.tsx` もしくは同等の結果表示ページ

## Implementation Plan（最小ステップ）
1. 参照箇所の特定（起点コンポーネント/呼び出し箇所の確定）
2. マスコットパネルに `variant` を追加し、未指定なら `studying` にする
3. `variant` 対応表（画像パス/メッセージ）を1箇所に集約する
4. 結果画面で既存判定に基づいて `variant` を渡す
   - success（全正解）: success
   - それ以外: encourage
5. 既存画面の回帰がないことを確認する（結果画面以外は従来の studying のまま）
6. make verify → make evidence

## Acceptance Criteria（受け入れ条件）
- 初心者モードの結果画面で
  - 全テストケース正解のとき、`/assets/characters/indicating.gif` と「おめでとう！」が表示される
  - どこか不正解のとき、`/assets/characters/cheering.gif` と「もう一回見直してみよう」が表示される
- 結果画面以外の初心者モード画面では、従来どおり `studying` が表示される（意図しない文言変更がない）
- 上級者モードの表示に影響がない
- make verify / make evidence が成功する

## NFR（4軸チェック）
- 安全性: public assets 参照のみ。外部通信や権限を増やさない。判定は既存の成功/失敗を流用し、二重判定のズレを作らない。
- 変更容易性: variant 対応表を集約し、追加は表の拡張で済む。
- 性能: 重い計算を入れない。必要なら集計は1回だけで boolean 化する。
- 運用: 変更ファイルを最小化し、evidenceログを残す。

## Test Plan
- 手動: 成功結果/失敗結果の両方で結果画面を表示し、画像とメッセージを確認する。
- 自動:
  - make verify
  - make evidence
