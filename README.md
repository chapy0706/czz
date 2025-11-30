# 指示厨 

指示厨は、ユーザーが「指示（操作）」を組み立ててデータ処理の課題を解決するゲームです。  
UNIX哲学と TDD の考え方を取り入れ、「小さな命令を組み合わせて問題を解く体験」を通じて  
プログラミングやエンジニアリングに興味を持てるよう設計しています。
Next.js / TypeScript / Drizzle / PostgreSQL / SWR / Zustand を組み合わせて構築します。

---

# 1. コンセプト

- ユーザーが指示（命令）を並べてプログラムを構築する
- 内部では JSON ベースの DSL（Domain Specific Language）を使って実行
- テストケースをすべてクリアすればステージ突破
- 初心者モードは日本語ラベル、上級者モードはコマンド名（UNIX 風）で同じ課題に挑戦
- 管理画面から課題・テストケース・模範 DSL を登録可能  
- 将来的に「初心者モードで触った動作が Linux コマンドに対応している」体験へつなげる

---

# 2. 技術スタック

## フロントエンド
- Next.js 14（App Router）
- TypeScript
- Tailwind CSS
- SWR
- Zustand（状態管理）
- Client Components（ゲーム画面）
- Server Components（管理画面）

## バックエンド / API
- Next.js Route Handlers（BFF）
- Drizzle ORM
- PostgreSQL
- Supabase Auth（認証）
- Zod（バリデーション）

## 開発環境 / インフラ
- Docker / Docker Compose
- GitHub Actions（CI）
- Vercel（デプロイ）
- Vitest（TDD）
- Playwright（E2E）
- Biome（Linter / Formatter）

---

# 3. ディレクトリ構成（Monorepo）

```
czz/
├─ apps/
│  ├─ user/            # ユーザー用ゲームアプリ
│  └─ admin/           # 管理画面
│
├─ packages/
│  ├─ dsl-core/        # DSL エンジン
│  ├─ types/           # 型 + Zod スキーマ
│  └─ ui/              # 共通 UI
│
├─ infra/
│  ├─ docker/          # Dockerfile / compose
│  └─ drizzle/         # Drizzle schema / migrations
│
├─ e2e/                # Playwright
├─ tests/              # Vitest
├─ package.json
├─ pnpm-workspace.yaml
└─ README.md
```

---

# 4. DSL 設計方針

DSL は JSON ベースの内部DSLとして設計し、  
配列データのパイプライン処理を行う形を基本とします。

## 4.1 モードの扱い
- DSL、課題、テストケースは全モード共通
- 初心者／上級者の違いは UI側のラベル表示のみ

## 4.2 DSL の構造

```
DslProgram {
  version: "1";
  instructions: DslInstruction[];
}
```

## 4.3 初期命令セット

- FILTER  
- SORT  
- PROJECT  
- MAP_SET  
- MAP_ADD  
- TAKE  
- SKIP  
- UNIQUE  
- GROUP_COUNT  
- OUTPUT  

UNIX の grep, sort, uniq, awk, head などに相当する処理で構成されている。

## 4.4 TypeScript 型設計（概要）

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


# 5. データベース（PostgreSQL + Drizzle）

### ローカル環境 Docker

```
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: czz_dev
    ports:
      - "5432:5432"
```

### Drizzle スキーマ例

```
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  dslProgram: jsonb("dsl_program").notNull(),
  testCases: jsonb("test_cases").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

---

# 6. 認証方式（Supabase Auth）
- OSS で透明性が高い  
- PostgreSQL と連携が自然  
- RLS（Row Level Security）が使える  
- UNIX 的に“薄い抽象”で扱いやすい

---

# 7. 状態管理（Zustand）
- 軽量・柔軟  
- 分散 UI を跨いで共有状態を扱いやすい  
- Redux のように重くない

---

# 8. データ取得（SWR）
- 軽量・依存が少ない  
- キャッシュ、再フェッチ、エラー処理が一元化  
- ISR/SSG と相性が良い

---

# 9. バリデーション（Zod）
- DSL / タスク / API 入力データの整合性保証  
- 実行時チェック（Runtime Safety）
- TypeScript の型と1箇所で同期管理

---

# 10. Linter / Formatter（Biome）
- 静的解析（潜在バグ発見）
- コード整形（Prettier 代替）
- Monorepo と相性が良い

---

# 11. テスト戦略（Vitest + Playwright）

## Unit / Integration（Vitest）
- DSL 命令の TDD  
- BFF(API) の結合テスト

## E2E（Playwright）
- カード並べ → 実行 → 合否確認  
- ユーザー操作をそのまま自動テスト

---

# 12. レンダリング方式（SSG / ISR / SSR）

| ページ | 手法 | 理由 |
|--------|------|------|
| `/` | SSG | 静的で十分 |
| `/tasks` | ISR | 3日に1回更新に最適 |
| `/tasks/[id]` | ISR or SSR | 更新頻度による |
| ゲーム画面 | Client Component | アニメーションが必要 |
| 管理画面 | SSR | 最新の DB 状態が必要 |

---
# 13. Docker 開発環境

```
docker compose -f infra/docker/docker-compose.dev.yml up --build
```

- user-app → http://localhost:3000  
- admin-app → http://localhost:3001  
- PostgreSQL → localhost:5432  

---

# 14. Vercel デプロイ
- user と admin を別プロジェクトでデプロイ  
- `DATABASE_URL` を設定  
- ISR 使用のため On-Demand Revalidate を利用可能

---

# 15. 今後の拡張案
- DSL 命令追加
- Linux コマンドとの自動対応表
- AI による課題生成
- プレイヤーの進捗管理
- ランキング・レベルシステム
- AWS CDK / Terraform による IaC 化
