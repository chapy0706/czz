<!-- docs/specs/active/2026-02-15-issue-TBD-beginner-ignore-runner-io-unselected.md -->

# Spec: 初心者モードでRunnerのinput/output未選択が正誤判定に影響しないようにする

- Issue: TBD
- Owner: TBD
- Status: draft
- Updated: 2026-02-15

## Why（目的）
- 初心者モードは「操作ミスや未選択」で詰まらせないことが重要。
- Runnerの input/output 未選択というUI状態は、学習者の正誤（テストケースの成功/失敗）と本質的に無関係なので、正誤判定から切り離す。

## 用語（このspec内）
- Runner IO: Runnerが表示/利用する input/output の選択状態（Store上の状態を含む）。
- 未選択: input もしくは output が `null/undefined/""` 等で「選ばれていない」状態。

## 仕様
### 初心者モード
- Runner IO が未選択であっても、正誤判定（結果の success/fail）に影響しないこと。
- 期待する挙動（例）:
  - 正誤判定は「テストケースの実行結果」だけで決まる。
  - Runner IO 未選択は、UI上の表示（入出力の見え方）にだけ影響し、成否判定には混ざらない。

### 上級者モード
- 現状挙動を維持（未選択が失敗扱いになる/ならないのいずれでもよい。変更を最小化する）。

## NFR（非機能要件：4軸）
- 安全性: 判定ロジックをUI状態に依存させない（予期しないfailを防ぐ）。
- 変更容易性: 判定の“入力”を明確化（pure function化）し、将来のUI変更で壊れにくくする。
- 性能: 追加計算は軽量であること（ループはテストケース数程度）。
- 運用: 再発防止のため、E2Eまたはunitのどちらかで1ケースは担保する。

## Acceptance Criteria（受け入れ条件）
1. 初心者モードで Runner IO が未選択でも、結果の正誤判定が変わらない。
2. 初心者モードで Runner IO を選択した場合も、従来通り正誤判定が行われる（選択が“悪影響”を及ぼさない）。
3. 上級者モードは挙動が変わらない（意図しない差分が出ない）。
4. `make verify` と `make evidence` が成功する。
5. （推奨）E2Eまたはunitで、未選択状態の再現テストが1つ以上ある。

## 調査の当たり（候補ファイル）
- Runner IO 状態（候補）
  - `apps/user/src/lib/command-builder/runnerIo.ts`
  - `apps/user/src/lib/command-builder/commandBuilderStore.ts`
  - `apps/user/src/lib/terminal/runnerIo.ts`
  - `apps/user/src/lib/terminal/terminalStore.ts`
- 判定が混ざっていそうな表示（候補）
  - `apps/user/src/lib/terminal/ResultPanel.tsx`
  - `apps/user/app/results/[resultId]/page.tsx`
- E2E
  - `e2e/tests/user-flow-top-to-result.spec.ts`

## 実装計画（最小ステップ）
1. 影響経路の特定
   - Runner IO の未選択が、どの条件で「失敗」や「不正解」に変換されているかを `rg` で追跡する。
2. 判定を分離
   - 初心者モードでは、正誤判定の根拠を「テストケース結果」だけに固定する。
   - Runner IO 未選択は UI上の表示のみに影響するように分岐を入れる。
3. テスト追加
   - unit（可能なら）: `isAllPassed` / `computeResultStatus` のような純関数に対して未選択ケースを追加
   - もしくはE2Eで、未選択状態で結果が変わらないことを確認
4. 検証
   - `make verify`
   - `make evidence`

## テスト計画
- 必須:
  - `make verify`
  - `make evidence`
- 推奨（どちらか）:
  - unit: Runner IO 未選択を入力しても判定が変わらないこと
  - e2e: 未選択をUIで再現し、成功/失敗の表示が期待通りであること
