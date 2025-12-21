<!-- path: docs/seed-and-test.md -->

# Seed & Test Guide

このドキュメントは **czz を初めて触る人が、迷わず同じ結果を再現できる** ことを目的にしています。  
環境構築 → DB 初期化 → seed 投入 → 動作確認、を一本道で固定します。

---

## このドキュメントでできること

- ローカル環境で DB を **安全に初期化** できる
- seed データを入れて **即ゲームを実行** できる
- API / DSL 評価の **最低限の動作確認** ができる
- 「どこで詰まったか」を他人に正確に伝えられる

---

## 前提条件

- Node.js（LTS）
- pnpm
- Docker / Docker Compose
- PostgreSQL（Docker コンテナ）

---

## 1. リポジトリ取得

```bash
git clone <repository-url>
cd czz
pnpm install
```

---

## 2. 開発用 DB 起動

```bash
docker compose up -d
```

確認：

```bash
docker ps
```

PostgreSQL コンテナが `Up` になっていれば OK。

---

## 3. DB 初期化（!! 破壊的操作 !!）

以下は **開発環境限定**。  
本番 DB では絶対に実行しない。

```bash
pnpm db:reset
```

内部で行っていること：

1. 既存テーブル削除
2. migration 適用
3. schema 再作成

---

## 4. Seed データ投入

```bash
pnpm db:seed
```

投入されるデータ例：

- ユーザー（一般 / 管理）
- 公開済み Task
- Task に対応する DSL プログラム
- テストケース（testCases）

---

## 5. 開発サーバ起動

```bash
pnpm dev
```

- UI: http://localhost:3000
- API: http://localhost:3000/api/*

---

## 6. 動作確認（UI）

1. ブラウザで UI を開く
2. Seed 済み Task を選択
3. DSL を実行
4. 結果が **Success / Failure** として表示されることを確認

---

## 7. 動作確認（API）

### タスク一覧取得

```bash
curl http://localhost:3000/api/tasks
```

### タスク評価

```bash
curl -X POST http://localhost:3000/api/tasks/<taskId>/evaluate \
  -H "Content-Type: application/json" \
  -d '{ "program": [...] }'
```

- 200: 評価成功
- 4xx: 入力不正（Zod parse 失敗）
- 5xx: 内部エラー（要調査）

---

## 8. DSL 単体確認（開発者向け）

```bash
pnpm test
```

- dsl-core の Executor / TestRunner が通ること
- UseCase の評価ロジックが壊れていないこと

---

## トラブルシューティング

### DB 接続できない

- Docker が起動しているか
- `.env` の DB 接続情報が一致しているか

### Seed が失敗する

- migration が最新か
- JSONB の schema 変更後、Zod と一致しているか

### 評価結果がおかしい

- DSL Core の schema / executor を確認
- testCases の期待値を確認

---

## 安全のための運用ルール

- `db:reset` は **ローカル専用**
- Seed データは「教材用・検証用」と明示
- 本番相当のデータは絶対に seed に含めない

---

## このドキュメントの役割

- **README を汚さない**
- **Issue / PR の前提条件を揃える**
- **未来の自分の記憶を信用しない**

このファイルがあることで、  
「動かない」「再現できない」「環境依存」の議論を最小化できます。
