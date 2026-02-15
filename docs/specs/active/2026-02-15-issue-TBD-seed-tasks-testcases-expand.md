<!-- docs/specs/active/2026-02-15-issue-TBD-seed-tasks-testcases-expand.md -->

# Spec: seed課題データ（tasks/testCases）の見直しと追加（合計20課題・各5ケース）

- Issue: TBD
- Owner: TBD
- Status: draft
- Updated: 2026-02-15

## Why（目的）
- seed投入される課題データは「学習体験の土台」なので、欠損や難易度のブレを無くす。
- 初心者が短時間で達成感を積み上げられるボリューム（20課題）に増やし、難易度を段階化する。
- 1課題あたりのテストケース本数を5本に統一し、学習者・実装者どちらにとっても見通しを良くする。

## 現状の前提（このspecの対象）
- 課題一覧は `make` 経由で seed スクリプトから投入される。
- 候補パス（treeより）:
  - `infra/drizzle/scripts/seed_reset.sh`
  - `infra/drizzle/scripts/seed_cleanup.sql`
  - `infra/drizzle/scripts/seed_insert.sql`
  - `infra/drizzle/scripts/seed_verify.sql`
- 本specは **seed投入データ（tasks/testCases）の内容** を変える。評価ロジックやDSLコマンド自体は変えない。

## NFR（非機能要件：4軸）
- 安全性: seed以外を壊さない。Secretsに触れない。空ケース（欠損）を作らない。
- 変更容易性: 課題の追加・修正が「1ファイル（seed_insert.sql中心）」で追えること。順序を固定し、既存E2Eを壊しにくくする。
- 性能: 追加課題は20件程度。seed/一覧取得に過剰な負荷を増やさない。
- 運用: `make verify` / `make evidence` を必ず回し、seed投入結果が再現できる。

## 仕様（データ要件）
### 共通
- 課題は合計20件（既存5 + 新規15）。
- 各課題の `testCases` は **5本** に統一する。
- テストケースは「空オブジェクト」や「必須項目欠損」を含まない。
  - 空配列などの“意図した境界値”は可。ただし **入力/期待値が明示**されていること。

### 既存課題の修正
- 課題1（タイトルが「なにもしないよ」の課題）
  - testCases 5本すべてで「入力データの全ての値」を 0 にする。
  - 例: 長さを変えるのはOK（例: 1/3/5/8/10件）が、値は必ず0。
  - “なにもしない”の意図に合わせ、期待値は入力と一致する形にする（既存スキーマに沿う）。
- 課題2
  - testCases の2つ目が “空” になっている箇所を修正し、他ケースと同じ形式で埋める。
  - もし「空配列」等を境界値として入れるなら、空である理由と期待値を明示する（空オブジェクトは禁止）。

### 新規課題の追加（15件）
- 追加する課題は次の3段階に分ける。
  - 1コマンド課題: 5件（入門：単機能を理解）
  - 2コマンド課題: 5件（合成：小さな部品を繋ぐ）
  - 3コマンド課題: 5件（流れ：フィルタ→変換→集約/抽出 など）
- それぞれの課題には「想定解（dslProgram）」を登録し、コマンド数が要件に一致していること。
  - 1コマンド課題: commands.length = 1
  - 2コマンド課題: commands.length = 2
  - 3コマンド課題: commands.length = 3

注:
- 実際のコマンド種類は既存 `commandCatalog.ts` に存在するもののみを使う。
- 既存の5課題の順序は保つ（E2E/説明の連番が崩れないようにする）。

## 追加課題案（タイトル/狙い/想定コマンド）
この案は “雛形” で、実データ形式は既存seedのスキーマに合わせて実装する。

### 1コマンド（5件）
1. 昇順に並べて（SORT_ASC）
2. 降順に並べて（SORT_DESC）
3. 合計を出して（OUTPUT_SUM）
4. 先頭を出して（OUTPUT_FIRST）
5. 末尾を出して（OUTPUT_LAST）

### 2コマンド（5件）
6. 昇順にして末尾を出して（SORT_ASC → OUTPUT_LAST）
7. 降順にして先頭を出して（SORT_DESC → OUTPUT_FIRST）
8. 3より大きいものだけ残して合計（FILTER_GT(3) → OUTPUT_SUM）
9. 10を足して合計（MAP_ADD(10) → OUTPUT_SUM）
10. 2倍して合計（MAP_MULTIPLY(2) → OUTPUT_SUM）

### 3コマンド（5件）
11. 3より大きいものだけ残して10を足して合計（FILTER_GT(3) → MAP_ADD(10) → OUTPUT_SUM）
12. 5より大きいものだけ残して降順にして先頭（FILTER_GT(5) → SORT_DESC → OUTPUT_FIRST）
13. 2倍して昇順にして末尾（MAP_MULTIPLY(2) → SORT_ASC → OUTPUT_LAST）
14. 7を足して昇順にして先頭（MAP_ADD(7) → SORT_ASC → OUTPUT_FIRST）
15. 2より大きいものだけ残して2倍して合計（FILTER_GT(2) → MAP_MULTIPLY(2) → OUTPUT_SUM）

## テストケース設計ガイド（各課題5本）
- 5本の内訳例:
  - 1本: 最小ケース（1〜2件）
  - 2本: 代表ケース（5〜8件、重複/順序が混ざる）
  - 1本: 境界ケース（空配列 or 全て同値 or 負数混在など、課題に意味がある範囲で）
  - 1本: ひっかけケース（ソート方向、フィルタ閾値、合計の桁など）
- 「空ケース」は禁止（空オブジェクト/欠損）。
  - 空配列を入れる場合は、入力が空配列であることと期待値（例: 合計=0 / 出力空など）を明示する。

## 実装方針（どこをどう直すか）
1. seed投入経路を確認
   - `Makefile` から seed に到達するターゲットを特定（例: `make db-reset` 等）。
   - 実際に tasks/testCases を投入しているファイルを特定（基本は `seed_insert.sql`）。
2. 既存5課題の testCases を “5本に統一” しつつ修正
   - 課題1: 全て0
   - 課題2: 2つ目の空を解消
3. 新規15課題を “既存5の後ろに追加” する
   - 順序固定（既存E2E影響最小化）
   - それぞれ `dslProgram` は要件のコマンド数に合わせる
4. seed検証（必要なら）
   - `seed_verify.sql` に task件数や testCases件数の検証があるなら更新する（20件前提）。
5. 検証
   - `make verify`
   - `make evidence`
   - （推奨）E2E: user-flow-top-to-result.spec.ts

## Acceptance Criteria（受け入れ条件）
1. 課題は合計20件（既存5 + 新規15）。
2. 各課題の testCases は必ず5本で、空オブジェクト/欠損が無い。
3. 課題1（なにもしないよ）の testCases は「入力データの全ての値が0」になっている。
4. 課題2の testCases 2つ目の “空” が解消されている（意図があるなら明示）。
5. 新規15課題が追加され、想定解（dslProgram）のコマンド数が 1/2/3 の段階に一致する。
6. `make verify` と `make evidence` が成功する。

## 変更候補ファイル
- `infra/drizzle/scripts/seed_insert.sql`
- `infra/drizzle/scripts/seed_verify.sql`（必要なら）
- `docs/seed-and-test.md`（必要なら、課題数/確認手順の追記）
- `e2e/tests/user-flow-top-to-result.spec.ts`（必要なら最小限）
