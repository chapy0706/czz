<!-- docs/specs/active/2026-02-15-issue-TBD-results-screen-beginner-ja-mascot-hide-meta.md -->

# Spec: 結果画面を初心者モード日本語化し、成否GIFとメタ情報非表示を適用する

- Issue: TBD
- Owner: TBD
- Status: draft
- Updated: 2026-02-15

## Why（目的）
- 初心者モードでは「読むだけで迷子にならない」ことが最優先。結果画面の文言を日本語に揃える。
- 結果の成否が一目で分かるように、成功/失敗のGIFを出し分ける。
- 実行時間・IDなど内部メタ情報は学習体験のノイズなので、全モードで画面から除去する。

## 要件（機能）
### 1) 初心者モード：結果画面の文言をすべて日本語にする
- 対象は「結果画面（/results/[resultId]）」と、必要なら「実行中画面（/results/running）」のうち結果画面に準じる文言。
- 既存の英語/UNIX風トーンは上級者モードでは維持してよい。

実装方針（最小）:
- 画面内ラベルを `const labels = { beginner: {...}, advanced: {...} }` のように集約し、UIモードで切替する。
- i18nライブラリは入れない（Non-goals）。

### 2) 成否GIFの出し分け
- テストケースがすべて正解のとき:
  - 表示: `apps/user/public/assets/characters/rejoicing.gif`
- 1つでも失敗があるとき:
  - 表示: `apps/user/public/assets/characters/failing.gif`

注意:
- public配下の参照は、実装上は `src="/assets/characters/rejoicing.gif"` のようなURL参照にする。
- `alt` は初心者モードでは日本語（例: 「やったね！」/「うまくいかなかった…」など）。上級者モードは現状に合わせてよい。

### 3) 全モード共通：実行時間やIDを画面に出さない
- 「CSSで隠す」ではなく、Reactツリー上で render しない（DOM非生成）。
- 対象例:
  - Result ID
  - 実行時間 / duration
  - その他 “内部メタ” と判断できる表示（結果の学習体験に不要なもの）

## NFR（非機能要件：4軸）
- 安全性: `.env*` に触れない。表示から消すのはDOM非生成で行う（情報漏えい防止）。
- 変更容易性: ラベルは1箇所に集約し、今後の文言修正を局所化する。
- 性能: 画像は public からの静的配信。余計なデータ取得を増やさない。
- 運用: `make verify` / `make evidence` を回し、E2E（可能なら）で表示検証する。

## Acceptance Criteria（受け入れ条件）
1. 初心者モードの結果画面で、ユーザーに見える文言がすべて日本語になっている（英語ラベルが残らない）。
2. テストケースが全件成功なら `rejoicing.gif` が表示される。
3. テストケースに1件でも失敗があれば `failing.gif` が表示される。
4. 全モードで「実行時間」や「ID」が画面（DOM）に表示されない。
5. `make verify` と `make evidence` が成功する。
6. （推奨）E2Eで、結果画面にID/実行時間が出ていないことを1ケース以上検証する。

## 調査の当たり（候補ファイル）
- ルート:
  - `apps/user/app/results/[resultId]/page.tsx`
  - `apps/user/app/results/running/page.tsx`
  - `apps/user/app/results/running/ResultsRunningClient.tsx`
- 結果表示ロジック（候補）:
  - `apps/user/src/lib/terminal/ResultPanel.tsx`
  - `apps/user/src/lib/terminal/terminalStore.ts`
- UIモード:
  - `apps/user/src/lib/ui-mode/uiModeStore.ts`
  - `apps/user/src/components/providers/ui-mode-provider.tsx`
- E2E:
  - `e2e/tests/user-flow-top-to-result.spec.ts`

## 実装計画（最小ステップ）
1. 現状把握
   - 結果画面がどのコンポーネントで構成されているかを特定（page.tsx → ResultPanel等）。
   - 結果データから「テストケース単位の成否」がどこに存在するかを確認（resultStatusだけなのか、配列があるのか）。
2. 判定関数を定義
   - `isAllPassed(result): boolean` のように、判定を純関数化してUIに埋めない。
3. 文言の集約
   - “結果画面で使うラベル” を1箇所にまとめ、UIモードで切替。
4. GIF表示の追加
   - `isAllPassed` により `rejoicing.gif` / `failing.gif` を出し分け。
5. 実行時間/IDなどのメタ表示を削除
   - 既存表示箇所からDOM出力を除去（propsや型は残してよいが表示しない）。
6. 検証
   - `make verify`
   - `make evidence`
   - （可能なら）E2Eで表示確認を追加

## テスト計画
- 必須:
  - `make verify`
  - `make evidence`
- 推奨:
  - `e2e/tests/user-flow-top-to-result.spec.ts` に以下を追加
    - 結果画面に `Result ID` / `Execution time` などが存在しない
    - 成功時に `rejoicing.gif` が表示される（`img[src*="rejoicing.gif"]` 等で確認）
