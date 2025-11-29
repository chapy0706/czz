# 指示厨 

指示厨は、ユーザーが「指示（操作）」を組み立ててデータ処理の課題を解決するゲームです。  
UNIX哲学と TDD の考え方を取り入れ、「小さな命令を組み合わせて問題を解く体験」を通じて  
プログラミングやエンジニアリングに興味を持てるよう設計しています。

---

## 1. コンセプト

- ユーザーが指示（命令）を並べてプログラムを構築する
- 内部では JSON ベースの DSL（Domain Specific Language）を使って実行
- テストケースをすべてクリアすればステージ突破
- 初心者モードは日本語ラベル、上級者モードはコマンド形式ラベルで学習効果を高める
- 将来的に「初心者モードで触った動作が Linux コマンドに対応している」体験へつなげる

---

## 2. 特徴

- データのパイプライン処理を直感的に体験できる
- UNIX の基本思想「小さな道具の組み合わせ」に忠実な設計
- TDD 的な課題構造（テストケースを全て通すとクリア）
- 管理画面から自由に課題を追加可能（作問機能）
- 課題・テストケース・DSL のすべてを JSON で管理し、型安全に処理

---

## 3. DSL 設計方針

DSL は JSON ベースの内部DSLとして設計し、  
配列データのパイプライン処理を行う形を基本とします。

### モードの扱い
- DSL、課題、テストケースは全モード共通
- 初心者／上級者の違いは UI側のラベル表示のみ

### DSL の構造
- `version`  
- `instructions: DslInstruction[]`  
- 命令はすべて Discriminated Union で型安全に定義する

---

## 4. DSL の命令セット（初期版）

1. FILTER  
2. SORT  
3. PROJECT  
4. MAP_SET  
5. MAP_ADD  
6. TAKE  
7. SKIP  
8. UNIQUE  
9. GROUP_COUNT  
10. OUTPUT  

UNIX の grep, sort, uniq, awk, head などに相当する処理で構成されている。

---

## 5. TypeScript 型設計（概要）

### JsonValue
JSON として保存できる値を型安全に扱うための型。

### DslInstruction
Discriminated Union による命令表現。

### DslProgram
`version` と `instructions` を含むプログラム単位。

### TestCase
課題ごとに指定される入力と期待値。

### Task
問題文・模範 DSL・テストケースを含む課題定義。

---

## 6. 課題作成（管理画面）の流れ

1. 問題文・説明・難易度などを入力  
2. テストケース（input / expectedOutput）を複数定義  
3. DSL プログラム（模範解答）を UI で構築  
4. 登録時に DSL とテストケースを使って検証  
5. すべて通過すれば DB（JSONB）に保存  
6. ゲーム画面でユーザーが挑戦可能になる

---

## 7. ゲーム画面の仕組み

- ユーザーは指示カードを選択・並べ替えて DSL を構築する
- 初心者モードは日本語ラベル、上級者モードはコマンドラベル
- 実行ボタンで DSL を評価し、テストケースが全て通ればクリア

---

## 8. セットアップ手順

このプロジェクトは、ローカルでは Docker / docker-compose を用いた環境構築を想定し、  
本番相当のデプロイ先として Vercel を想定しています。

### 前提条件

- Node.js (推奨: v20 以降) ※ローカルで直接動かしたい場合
- Docker / Docker Compose
- GitHub アカウント（リポジトリ管理 / Vercel と連携する場合）
- Vercel アカウント（本番デプロイ用）

---

## 9. リポジトリの取得

```bash
git clone https://github.com/ychapy0706/czz.git
cd czz
```

---

## 10. 環境変数の準備

1. .env.example を元に .env を作成します（存在する場合）。

```bash
cp .env.example .env
```

2. 開発環境用の環境変数を設定します。例:

```env
# アプリ共通
NODE_ENV=development

# DB 接続 (docker-compose.dev.yml と合わせる)
DATABASE_URL=postgres://app:app@db:5432/app_dev

# その他、必要なキーがあれば追加
```

---

## 11. Docker によるローカル開発環境の起動

本プロジェクトでは、infra/docker 以下に Docker 用の定義ファイルを配置します。

- infra/docker/app.Dockerfile
- infra/docker/docker-compose.dev.yml
- infra/docker/docker-compose.ci.yml（CI / テスト用）

### 11-1. 開発環境 (Next.js dev server + PostgreSQL)

```bash
cd infra/docker
docker compose -f docker-compose.dev.yml up --build
```

これにより以下のコンテナが起動します。

- web : Next.js 開発サーバー (npm run dev)
- db : PostgreSQL（開発用 DB）

起動後、ブラウザで以下にアクセスします。
http://localhost:3000

ソースコードを修正すると、web コンテナ内でホットリロードされます。

### 11-2. Prisma マイグレーションの実行（必要な場合）

DB スキーマを最新化するために、コンテナ内またはホスト側から Prisma のマイグレーションを実行します。

例: コンテナ内で実行する場合
```bash
docker compose -f docker-compose.dev.yml exec web npx prisma migrate dev
```

---

## 12. テスト実行（TDD / CI 想定）

infra/docker/docker-compose.ci.yml を用いて、テストと E2E をコンテナで実行することを想定しています。

例: 単体テスト / 結合テストを実行する場合
```bash
cd infra/docker
docker compose -f docker-compose.ci.yml up --abort-on-container-exit --exit-code-from app-test
```
例: E2E テスト (Playwright) を実行する場合
```
cd infra/docker
docker compose -f docker-compose.ci.yml up --abort-on-container-exit --exit-code-from app-e2e
```
詳細なサービス構成は docker-compose.ci.yml 内の定義に従います。

---

## 13. Vercel へのデプロイ手順

本番環境として Vercel を利用する場合の基本的な流れは以下の通りです。

### 13-1. GitHub リポジトリと連携

コードを GitHub リポジトリにプッシュします。
Vercel のダッシュボードにアクセスし、「New Project」から GitHub リポジトリを選択します。

### 13-2. プロジェクト設定

Vercel のセットアップ画面で、以下を確認・設定します。

- Framework Preset: Next.js
- Build Command: npm run build
- Install Command: npm install または npm ci（必要に応じて）
- Output Directory: .next

基本的には Next.js プリセットのデフォルト設定で問題ありません。

### 13-3. 環境変数の設定

Vercel の Project Settings > Environment Variables から .env に設定した値を登録します。

例:

- DATABASE_URL（Supabase や本番用 PostgreSQL の接続文字列）
- その他、必要な環境変数

### 13-4. デプロイ

設定が完了したら、Vercel が自動的にビルドおよびデプロイを実行します。
GitHub の main / master ブランチにプッシュするたびに、自動でプレビュー/本番デプロイが行われます。

---

## 14. 本番環境と開発環境の住み分け

- ローカル開発:
  - Docker（docker-compose.dev.yml）上の Next.js + PostgreSQL を利用

- CI / テスト:
  - docker-compose.ci.yml によりテスト用コンテナを構築し、単体テスト・結合テスト・E2E テストを実行

- 本番:
  - Vercel: Next.js アプリケーションのホスティング
  - DB: Supabase またはマネージド PostgreSQL を利用
  - DATABASE_URL などの環境変数で接続先を切り替える

