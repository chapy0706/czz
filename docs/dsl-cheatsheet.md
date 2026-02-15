# DSL Cheatsheet

入力は **数値配列**、命令は **上から順に適用** します。
仕様の一次情報は `packages/dsl-core/src/schema.ts` です。

## 形式
```json
{"commands":[{"type":"FILTER_GT","value":3}]}
```

## 命令一覧（Beginner / UNIX 対応）
| Type | Beginner 表記 | UNIX 表記の目安 | パラメータ |
| --- | --- | --- | --- |
| FILTER_EQUALS | 同じものだけのこす | grep VALUE | value:number |
| FILTER_NOT_EQUALS | 違うものだけのこす | grep -v VALUE | value:number |
| FILTER_GT | 大きいものだけのこす | awk '$1>VALUE' | value:number |
| FILTER_LT | 小さいものだけのこす | awk '$1<VALUE' | value:number |
| FILTER_BETWEEN | 範囲でしぼる | awk 'MIN<=x<=MAX' | min:number, max:number |
| MAP_ADD | 数字を足す | awk '{print $1+VALUE}' | value:number |
| MAP_MULTIPLY | 数字をかける | awk '{print $1*VALUE}' | value:number |
| SORT_ASC | 小さい順に並べる | sort -n | なし |
| SORT_DESC | 大きい順に並べる | sort -nr | なし |
| OUTPUT_FIRST | 一番上だけ出す | head -n 1 | なし |
| OUTPUT_LAST | 一番下だけ出す | tail -n 1 | なし |
| OUTPUT_SUM | 合計を出す | awk '{s+=$1} END{print s}' | なし |

## 例
```json
{"commands":[{"type":"FILTER_GT","value":2},{"type":"OUTPUT_SUM"}]}
```

## 追従方法
- UI 表記: `apps/user/src/lib/command-builder/commandCatalog.ts`
- DSL 仕様: `packages/dsl-core/src/schema.ts`
- 実行ロジック: `packages/dsl-core/src/execute.ts`
