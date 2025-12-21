//docs/dsl-cheatsheet.md

# DSL Cheatsheet（命令一覧 + UNIX 対応イメージ）

この DSL は「入力配列（records）に対して、小さな命令を上から順に適用していく」JSON DSL です。  
発想は UNIX と同じで、**小さなコマンドをパイプで繋ぐ**感じになります。

- **submittedProgram**: 命令配列（commands）
- **test_cases**: 入力と期待出力のセット（テストが仕様）

> 重要：命令名・引数の shape は `// packages/dsl-core/src/schema.ts` が一次情報です。  
> このチートシートは **schema.ts と同じ命令名** を前提に書いています。ズレが出たら schema.ts 側を優先して更新してください。

---

## 0. 最短で「書いて試す」テンプレ（コピペ用）

### submittedProgram（命令列）

```json
[
  { "type": "FILTER_GT", "args": { "field": "value", "gt": 1 } },
  { "type": "MAP_ADD", "args": { "field": "value", "add": 10 } },
  { "type": "SORT_DESC", "args": { "field": "value" } },
  { "type": "OUTPUT_FIRST" }
]
```

### test_cases（入力 → 出力）

```json
[
  {
    "input": [{ "value": 1 }, { "value": 2 }, { "value": 5 }],
    "expected": { "value": 15 }
  }
]
```

この例の流れ：

1. `value > 1` のみ残す → `[2,5]`
2. `+10` → `[12,15]`
3. 降順 → `[15,12]`
4. 先頭を出力 → `{value:15}`

---

## 1. まずは “心のモデル”（UNIX 的な考え方）

- **records（配列）** が流れてくる
- 各命令が **records を加工** する（filter / map / sort）
- 最後に **output 命令** が「値を取り出して終わる」

UNIX 対応イメージ（雑に言うと）：

- FILTER\_\* ＝ `grep`（条件で絞る）
- SORT\_\* ＝ `sort`
- MAP\_\* ＝ `awk`（列を加工）
- OUTPUT\_\* ＝ `head` / `tail` / `sum`（集約・取り出し）

---

## 2. 命令一覧（type / 入力 / 出力 / 例 / UNIX 対応）

前提（典型）：

- 入力：`[{...}, {...}]`（records）
- 出力（変換系）：同じく records
- 出力（OUTPUT 系）：単一オブジェクト or 数値（実装に依存）

### 2-1. FILTER 系（絞り込み）

| Command             | 入力    | 出力    | JSON 例                                                          | UNIX イメージ      |
| ------------------- | ------- | ------- | ---------------------------------------------------------------- | ------------------ |
| `FILTER_EQUALS`     | records | records | `{ "type":"FILTER_EQUALS","args":{"field":"value","eq":3} }`     | `grep -E '^3$'` 的 |
| `FILTER_NOT_EQUALS` | records | records | `{ "type":"FILTER_NOT_EQUALS","args":{"field":"value","ne":3} }` | `grep -v` 的       |
| `FILTER_GT`         | records | records | `{ "type":"FILTER_GT","args":{"field":"value","gt":3} }`         | `awk '$1>3'` 的    |

### 2-2. MAP 系（値の加工）

| Command        | 入力    | 出力    | JSON 例                                                      | UNIX イメージ            |
| -------------- | ------- | ------- | ------------------------------------------------------------ | ------------------------ |
| `MAP_ADD`      | records | records | `{ "type":"MAP_ADD","args":{"field":"value","add":10} }`     | `awk '{print $1+10}'` 的 |
| `MAP_MULTIPLY` | records | records | `{ "type":"MAP_MULTIPLY","args":{"field":"value","mul":2} }` | `awk '{print $1*2}'` 的  |

### 2-3. SORT 系（並び替え）

| Command     | 入力    | 出力    | JSON 例                                           | UNIX イメージ |
| ----------- | ------- | ------- | ------------------------------------------------- | ------------- |
| `SORT_ASC`  | records | records | `{ "type":"SORT_ASC","args":{"field":"value"} }`  | `sort -n` 的  |
| `SORT_DESC` | records | records | `{ "type":"SORT_DESC","args":{"field":"value"} }` | `sort -nr` 的 |

### 2-4. OUTPUT 系（取り出し / 集約）

| Command        | 入力    | 出力            | JSON 例                                            | UNIX イメージ                   |
| -------------- | ------- | --------------- | -------------------------------------------------- | ------------------------------- |
| `OUTPUT_FIRST` | records | object          | `{ "type":"OUTPUT_FIRST" }`                        | `head -n 1` 的                  |
| `OUTPUT_LAST`  | records | object          | `{ "type":"OUTPUT_LAST" }`                         | `tail -n 1` 的                  |
| `OUTPUT_SUM`   | records | number / object | `{ "type":"OUTPUT_SUM","args":{"field":"value"} }` | `awk '{s+=$1} END{print s}'` 的 |

> 注：OUTPUT の戻り値（number か object か）は schema.ts / 実装に合わせてください。  
> `OUTPUT_SUM` が `{ "value": 123 }` を返す設計の可能性もあります。

---

## 3. 小さな例題（入力配列 → commands → 出力）

目的：**「条件で絞る → 加工 → 並べ替え → 取り出す」** を 1 回通す。

### 入力

```json
[{ "value": 1 }, { "value": 3 }, { "value": 2 }, { "value": 10 }]
```

### commands

```json
[
  { "type": "FILTER_GT", "args": { "field": "value", "gt": 1 } },
  { "type": "MAP_MULTIPLY", "args": { "field": "value", "mul": 2 } },
  { "type": "SORT_ASC", "args": { "field": "value" } },
  { "type": "OUTPUT_LAST" }
]
```

### 期待出力（例）

- `>1` → `[3,2,10]`
- `*2` → `[6,4,20]`
- 昇順 → `[4,6,20]`
- last → `{ "value": 20 }`

test_cases で書くと：

```json
[
  {
    "input": [{ "value": 1 }, { "value": 3 }, { "value": 2 }, { "value": 10 }],
    "expected": { "value": 20 }
  }
]
```

---

## 4. よくあるエラー（Zod エラーメッセージの読み方）

Zod のエラーはだいたい **「期待した型」 vs 「実際の型」** です。  
最初の 1 行だけ読めば、8 割片付きます。

### `Expected array, received object`

- 意味：配列が必要なのに、オブジェクトが来ている
- よくある原因：
  - `test_cases[0].input` を `{...}` にしてしまった（本当は `[{...}]`）
  - `submittedProgram` を `{...}` にしてしまった（本当は `[{...},{...}]`）

### `Expected number, received string`

- 意味：数値の場所に文字列が来ている
- よくある原因：
  - `"gt": "3"` のようにクォートしてしまった（`"gt": 3` が正しい）

### `Invalid enum value`

- 意味：`type`（命令名）が schema に存在しない
- よくある原因：
  - `SORT_DESK` みたいなタイポ
  - doc と実装がズレている（schema.ts を優先）

---

## 5. schema.ts とズレを作らないための運用

- 命令一覧表の **Command 名は schema.ts の enum/union をコピペ**して作る
- 引数名（`gt` / `add` / `mul` / `field`）も **schema.ts の shape を一次情報**にする
- 命令追加・変更したら、同じ PR でこのチートシートも更新する（ドキュメント負債を作らない）

---

## 6. 10 分で到達する最短ルート（初学者向け）

1. このページの **テンプレ（0 章）をコピペ**
2. `FILTER_GT` の `gt` を変えて挙動を確認
3. `MAP_ADD` の `add` を変えて挙動を確認
4. `SORT_DESC` と `SORT_ASC` を入れ替えて挙動を確認
5. `OUTPUT_FIRST` / `OUTPUT_LAST` を入れ替えて挙動を確認
