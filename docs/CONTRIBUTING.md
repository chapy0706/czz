# Contributing Guide

このドキュメントは **czz に手を入れるときの道標** です。  
「どこに書くか」「どこまで書いていいか」「何を守るか」を明確にします。

> czz は速度よりも **構造の理解と再現性** を重視します。  
> 迷ったら、このドキュメントと `docs/architecture-diagram.md` に立ち戻ってください。

---

## 目的（このリポジトリで大事にしていること）

- Clean Architecture の **依存方向を壊さない**
- JSON / 外部入力 / DB を **信用しない**
- テストとドキュメントを **実装と同じ重さ** で扱う
- 未来の自分・他人が **3分で状況を理解できる** 状態を保つ

---

## リポジトリ構成の考え方

```
apps/
  user/        UI + API（BFF）
  admin/       管理 UI（原則 API は持たない）

packages/
  domain/      Entity / Repository interface
  dsl-core/    DSL schema / executor / test-runner
  ui/          共通 UI（必要に応じて）

infra/
  drizzle/     DB schema / migration / repo 実装
  docker/      開発用コンテナ

docs/
  architecture-diagram.md
  seed-and-test.md
  dsl-cheatsheet.md
```

### 基本ルール

- **依存は内向きのみ**
  - UI → Application → Domain
  - Infrastructure は Domain interface を実装するだけ
- Domain は **どこにも依存しない**
- dsl-core は **Domain 非依存**

---

## 開発を始める前に

必ず以下を一度通してください。

1. `docs/architecture-diagram.md` を読む  
2. `docs/seed-and-test.md` でローカル起動を確認  
3. seed データで UI / API / DSL 実行が通ることを確認  

これが **共通のスタートライン** です。

---

## 変更内容別ガイド

### DSL 命令を追加・変更する場合

対象：
- `packages/dsl-core`

手順：

1. `schema.ts`
   - 命令 type を追加
   - args の shape を Zod で定義
2. Executor に処理を追加
3. ユニットテストを追加
4. `docs/dsl-cheatsheet.md` を更新
   - 命令一覧表
   - JSON 例
   - UNIX 対応イメージ

> **schema.ts が一次情報**  
> 実装・ドキュメントは必ず schema.ts に合わせる。

---

### UseCase を追加・変更する場合

対象：
- `apps/user`（UseCase 層）

ルール：

- UseCase は **手続きの組み立て役**
- DB / HTTP / UI の都合を持ち込まない
- 入力は **必ず parse 済み** の型を受け取る

やってはいけないこと：

- Repository 実装に直接依存する
- Zod schema を Domain に持ち込む
- UI 向けの分岐を入れる

---

### API を追加・変更する場合

対象：
- `apps/user` API（BFF）

ルール：

- API は **境界**
- ここで `unknown → Zod.parse → typed` を完結させる
- UseCase に生 JSON を渡さない

今後の方針：
- 認証導入後に API docs（Markdown → OpenAPI）を追加予定

---

### DB / Repository を変更する場合

対象：
- `infra/drizzle`

ルール：

- Domain interface を必ず経由する
- JSONB は **unknown として扱う**
- 返却前に Zod parse する

---

## テスト方針

- dsl-core：ユニットテスト必須
- UseCase：評価ロジックはテストで固定
- UI：最低限の動作確認（E2E は段階導入）

**テストが書けない変更は、設計が大きすぎるサイン**。

---

## ドキュメント更新ルール

以下に該当する場合は **必ず docs を更新**：

- 命令を追加・削除した
- 実行フローが変わった
- 再現手順が変わった

判断に迷ったら更新する（過剰なくらいでちょうどいい）。

---

## PR 前チェックリスト

- [ ] `pnpm test` が通る
- [ ] seed で再現できる
- [ ] schema.ts / 実装 / docs の命令名が一致している
- [ ] 依存方向を壊していない
- [ ] 未来の自分が読める

---

## 迷ったときの指針

- 「どこに書く？」→ architecture-diagram.md  
- 「どう動かす？」→ seed-and-test.md  
- 「DSL の意味は？」→ dsl-cheatsheet.md  
- 「それでも迷う」→ UseCase を一段小さく分ける  

---

## 最後に

このリポジトリは  
**“動くこと” より “説明できること”** を優先します。

説明できない変更は、まだ入れるタイミングではありません。
