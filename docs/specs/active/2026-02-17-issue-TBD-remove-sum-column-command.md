<!-- docs/specs/active/2026-02-17-issue-TBD-remove-sum-column-command.md -->

# Spec: 「列の合計を出す」コマンドを削除（UIから除外 + シード/課題から撤去）

- Issue: TBD
- Status: active
- Updated: 2026-02-17
- Owner: TBD

## Goal（勝利条件）

「列の合計を出す」コマンドを選択すると、

- 強制的に不正解になる
- かつ遷移が `/results` ではなく `/result`（誤ったパス）になる

という挙動が発生しており、学習体験を壊している。  
このため当該コマンドは **利用できないように削除（UIから除外）** し、関連データ（seed/課題）からも撤去する。

## 背景

- 初心者にとって「押したら必ず壊れるコマンド」は混乱の元。
- ルーティングの誤り（`/result` vs `/results`）は、原因の切り分けを難しくし、E2E安定性も落とす。
- まずはユーザーが踏めないようにする（危険除去）を優先する。

## Non-goals（やらないこと）

- `/result` と `/results` のルーティング不整合の根本原因追跡（別Issueで扱う）
- 既存タスク（DBに保存済み）の `dslProgram` を一括マイグレーションする
- DSL実行エンジン全体の設計変更

## 安全方針（削除の定義）

「削除」は次の意味で行う（運用安全性を優先）。

- UIのコマンド一覧（初心者/上級者）から除外し、選択できない
- seed/サンプル課題やテンプレが当該コマンドを参照しない
- 既存DBデータに当該コマンドが残っている可能性を考慮し、
  - DSLコア実装の完全削除は避ける（推奨）
  - もし削除するなら「既存データを読む経路」に影響がないことを確認する

## Scope（変更対象の当たり）

最終確定は /codex 探索でよいが、当たりは以下。

- コマンド一覧（UI）
  - `apps/user/src/lib/command-builder/**`
  - `apps/user/src/lib/commands/**`（コマンド定義やカタログがある場合）
  - `apps/user/src/components/beginner/**`（初心者モード用の一覧が別なら）

- seed/課題データ
  - `infra/drizzle/seed/**`（または `scripts/seed/**`）
  - `apps/**/seed/**`（存在する場合）
  - `docs/seed-and-test.md`（手順に当該コマンドが出てくるなら更新）

- ルーティング（関連するガード）
  - `apps/user/app/**` の遷移リンク（`/result` が残っていないか）

- E2E
  - `e2e/tests/**`（当該コマンドを選択するテストがあるなら更新）

## 仕様詳細

### 1) UIから除外

- コマンド選択一覧に「列の合計を出す」が表示されないこと
- 検索/フィルタがある場合もヒットしないこと
- 既にパイプラインに入っている場合（古いデータ等）は、
  - 表示が壊れないこと（ラベルのフォールバック等）
  - 編集画面で例外が出ないこと（最低限の防御）

### 2) seed/課題データから撤去

- seedで投入される課題/テストケースに当該コマンドが含まれないこと
- docsの手順・例・スクショ説明に出てくる場合は削除/置換すること

### 3) `/result` への遷移の掃除（最低限）

当該コマンド削除で “踏めない” 状態にするのが主目的だが、保険として以下を入れる。

- repo内に `/result` を直書きしている遷移/リンクが残っていないことを確認し、あれば `/results` に統一する
  - ただし、意図的に `/result` が正な箇所がある場合は除外（現行仕様に従う）

## Acceptance Criteria（受け入れ条件）

- コマンド一覧に「列の合計を出す」が出ない（初心者/上級者とも）
- seed/課題データで当該コマンドが使われていない
- 課題画面の主要フローで `/result` への遷移が発生しない（少なくとも当該コマンド由来では起きない）
- `make verify` が通る（必要ならE2E更新を含む）

## Implementation Plan（最小ステップ）

1) 文字列「列の合計」および該当コマンドID/slug を `rg` で特定
2) コマンドカタログから当該コマンドを除外（初心者/上級者双方）
3) seed/課題データから当該コマンド参照を除去
4) `/result` の直書きが残っていないか `rg` で確認し、必要なら `/results` に修正
5) E2E更新（当該コマンドを選ぶ手順があれば削除/置換）
6) `make verify` → `make evidence`

## Test Plan（証拠）

- 手動:
  - コマンド一覧に当該コマンドが出ない
  - 既存の課題プレイが壊れない
- 自動:
  - `make verify`
  - `make evidence`

---

## 追加対応（2026-02-17 追記）

### do
- OUTPUT_COUNT を選択した際に入力データの件数を返すように dsl-core を実装する
  - `packages/dsl-core/src/schema.ts` に OUTPUT_COUNT を追加
  - `packages/dsl-core/src/execute.ts` に OUTPUT_COUNT を追加（入力配列の長さを 1 要素配列で返す）
  - `packages/dsl-core/src/execute.test.ts` に OUTPUT_COUNT のテストを追加

### dont
- OUTPUT_COLUMN_SUM の実装は追加しない
- seed/migration の変更禁止
- /result と /results のルーティング修正禁止

### touch
- `packages/dsl-core/src/schema.ts`
- `packages/dsl-core/src/execute.ts`
- `packages/dsl-core/src/execute.test.ts`

### must
- OUTPUT_COUNT の結果が入力件数の 1 要素配列になる
