<!-- docs/specs/active/2026-02-15-fix-t3-filter-range-equality.md -->

# Spec: T3「2だけが見たい」— フィルタ系コマンド（同値/範囲2..2）が不正解になる不具合を修正

- Status: active
- Updated: 2026-02-15
- Owner: ちゃぴぃ

## Context（背景 / 現状）

課題 **「T3: 2だけが見たい」** において、以下のどちらのコマンド構成でも **正解** になる想定。

- コマンド: **同じものだけのこす** → 値に `2`
- コマンド: **範囲でしぼる** → 範囲を `2` から `2`

しかし現状は、実行すると意図せず結果画面へ遷移し、**不正解扱い**（fail）になる。

> 作業仮説:  
> 「同じものだけのこす」が内部的に「範囲でしぼる（from=value, to=value）」に落ちており、`from == to` を無効扱いにしている（もしくは half-open `[from, to)` の実装）ため、空配列になって失敗している可能性が高い。

## Repro（再現手順）

1. 課題一覧から **T3: 2だけが見たい** を選択
2. 次のいずれかでコマンドを組み、実行
   - A: **同じものだけのこす** → `2`
   - B: **範囲でしぼる** → `2` から `2`
3. 結果画面へ遷移し **不正解** になる（現状）

## Expected（期待する挙動）

- A/B どちらのコマンド構成でも、T3 の testCases に対して期待出力が一致し **正解（success）** になる
- `範囲でしぼる` は `from == to` を許容し、**その値と等しい要素だけ**が残る（inclusive）
- 少なくとも T3 の正解パスでは、評価処理が例外やスキーマエラーで落ちない

## Non-goals（やらないこと）

- UI文言の変更（コマンド名など）
- T3 以外の課題の仕様変更（ただし副作用で直るのはOK）
- 大規模リファクタ（コマンド体系の再設計など）
- DB schema 変更

## Affected Areas（当たり候補）

まずは「UI → DSL生成 → 実行 → 採点」の経路で、`2..2` がどう解釈されているかを突き止める。

### UI（コマンド定義 / パラメータ）
- `apps/user/src/lib/command-builder/commandCatalog.ts`
- `apps/user/src/lib/command-builder/serialize.ts`
- `apps/user/src/lib/command-builder/CommandEditorSheet.tsx`
- `apps/user/src/lib/command-builder/runnerIo.ts`

### 評価〜遷移（task実行 / result生成）
- `apps/user/src/lib/terminal/evaluateClient.ts`
- `apps/user/src/usecases/evaluateTask.ts`
- `apps/user/app/api/tasks/[taskId]/evaluate/route.ts`
- `apps/user/app/tasks/[taskId]/page.tsx`（実行→遷移ハンドラ）

### DSL実行（範囲/同値の意味論）
- `packages/dsl-core/src/schema.ts`
- `packages/dsl-core/src/execute.ts`
- `packages/dsl-core/src/execute.test.ts`

### テスト（回帰防止）
- `e2e/tests/command-builder-params.spec.ts`（パラメータ入力系）
- （必要なら）T3相当のE2Eを追加する

## Investigation Checklist（調査観点）

1. **T3 の testCases** が何を期待しているか確認  
   - 期待出力が「2のみ」になっているか
2. **同じものだけのこす** が内部でどのDSLノードに変換されるか確認  
   - `serialize.ts` の出力（dslProgram）をログ/デバッグで確認
3. **範囲でしぼる** の `from==to` が
   - 空結果になるのか
   - 例外になるのか
   - あるいは `to` が exclusive 扱いなのか  
   を切り分ける
4. 採点側が「評価エラー」を「不正解」として扱っていないか確認  
   - エラー時は result.output にエラー内容が入っているはず。内容も見る

## Fix Plan（修正方針）

- `範囲でしぼる` の意味論を **inclusive** に寄せる  
  - `from == to` を許容し、`value == from` の要素が残る
  - `from > to` は UI 側で入力制約するか、実行側で swap/validation error（どちらかに統一）
- 「同じものだけのこす」が `2..2` へ変換されているなら、そのまま通るようにする（重複実装を増やさない）
- 変更は **dsl-core の execute** を第一候補にし、UI側は必要最小限（型/パース/バリデーションの補強）に留める

## Acceptance Criteria（受け入れ条件）

1. T3 で、以下の両方のコマンド構成が **正解（success）** になる  
   - A: 同じものだけのこす → 2  
   - B: 範囲でしぼる → 2 から 2
2. `from == to` の範囲指定が「空結果」や「例外」にならない
3. 既存の他タスクの挙動が壊れていない（回帰無し）
4. 回帰防止として以下のいずれかが追加/更新されている  
   - dsl-core の unit test（`execute.test.ts` に `2..2` のテスト）  
   - もしくは E2E で T3 の正解パスを追加
5. `make verify` と `make evidence` が成功する

## Test Plan（証拠の取り方）

- `make verify`
- `make evidence`
- 手動:
  - T3 を開き、A/B 両方で success を確認
  - 結果画面の output も確認（エラーが出ていないこと）
