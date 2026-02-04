<!-- /README.md -->

# 指示厨（czz）

指示厨（czz）は、ユーザーが 「指示（命令）」を組み立ててデータ処理の課題を解決するゲーム です。
UNIX 哲学（小さな部品を組み合わせる）と TDD（振る舞いから設計する）の考え方を取り入れ、
「命令を並べる → 実行 → テストで検証」 という体験を通じて、プログラミングと設計の面白さに触れられるよう設計されています。

本プロジェクトは Clean Architecture を採用し、学習用途であっても
「なぜ分けるのか」「どこに責務があるのか」を説明できる構造を重視しています。

* * *
## 1. コンセプト

  * ユーザーは DSL（JSON）として 命令列 を組み立てる
  * 内部では DSL Core が命令を逐次実行し、結果を算出
  * テストケースをすべて通過すると課題クリア
  * 初心者モード：日本語ラベル中心の UI
  * 上級者モード：UNIX 風コマンド名で同一課題に挑戦
  * 管理画面から課題・テストケース・模範 DSL を登録可能
  * 将来的に「初心者モードの操作が Linux コマンド理解につながる」設計

* * *

## 2. 技術スタック

### フロントエンド

  * Next.js 14（App Router）
  * TypeScript
  * Tailwind CSS
  * SWR（データ取得）
  * Zustand（状態管理）

### バックエンド / API（BFF）

  * Next.js Route Handlers
  * Drizzle ORM
  * PostgreSQL
  * Zod（バリデーション）
### 開発・品質

  * pnpm / Monorepo
  * Vitest（Unit / UseCase TDD）
  * Playwright（E2E：予定）
  * Biome（Lint / Format）

* * *
## 3. ディレクトリ構成（最新版）
    czz/
    ├─ apps/
    │  ├─ user/            # ユーザー向けゲーム画面 + API
    │  └─ admin/           # 管理画面（課題登録）
    │
    ├─ packages/
    │  ├─ domain/          # Entity / Repository interface（純粋ドメイン）
    │  ├─ dsl-core/        # DSL 実行エンジン（TDD）
    │  ├─ types/           # 共有型（将来拡張）
    │  └─ ui/              # 共通 UI（予定）
    │
    ├─ infra/
    │  ├─ docker/          # 開発用 Docker
    │  └─ drizzle/         # DB / Repository 実装 / seed scripts
    │
    ├─ docs/               # 設計・思想ドキュメント
    ├─ Makefile            # 開発・運用コマンド
    └─ tsconfig.base.json
* * *
## 4. Clean Architecture 採用理由

### なぜ Domain は dsl-core に依存しないのか

  * Domain は ルールそのもの を表現する層
  * DSL の実装詳細は交換可能であるべき
  * 将来 DSL を差し替えても Domain は壊れない

### なぜ unknown → Zod parse を UseCase で行うのか

  * DB（JSONB）は 信頼しない
  * UseCase が「安全な境界線」
  * UI / Infra の汚れを Domain に持ち込まない

### なぜ Repository / UseCase / UI を分けるのか

  * UI は「操作」
  * UseCase は「判断」
  * Repository は「保存」
  * 役割を分けることで 説明可能な設計 になる

* * *

## 5. DSL 設計（dsl-core）
### DSL の基本構造

    {
      commands: [{ type: "SORT_ASC" }, { type: "MAP_ADD", value: 10 }];
    }

### 命令セット（初期）

  * FILTER_EQUALS / FILTER_GT
  * MAP_ADD / MAP_MULTIPLY
  * SORT_ASC / SORT_DESC
  * OUTPUT_FIRST / OUTPUT_LAST / OUTPUT_SUM

* * *

## 6. データベース設計

  * users / tasks / results
  * JSONB は保存形式
  * 正当性は Zod + UseCase で担保

* * *

## 7. テスト戦略

  * DSL Core：TDD
  * UseCase：Fake Repository
  * 手動検証：seed_reset

* * *

## 8. 開発用コマンド

    make db-reset
    make dev-user
    make test-user

* * *
## 9. 現在の到達点

  * DSL Core 完成
  * タスク評価 API 完成
  * ユーザー画面で実行・確認可能
  * 設計意図を説明可能な構成

* * *

## 10. 今後の拡張

  * 認証
  * UX 改善
  * 進捗管理
  * 教育用資料整備

* * *
## 11. ライセンス

本リポジトリのソースコードは MIT License です。詳細は `LICENSE` を参照してください。

ただし、`apps/user/public` 配下などのアセット（画像 / 音源 / フォント等）は第三者制作物を含む可能性があり、ソースコードの MIT とは別条件が適用されます。

## 12. アセットのクレジット / Third-Party Notices

アセットの提供元とクレジット方針は、以下の 2 つを正として管理します。

* アプリ内のクレジットページ：`apps/user/app/credits/page.tsx`（`/credits`）
* リポジトリ内の台帳：`THIRD_PARTY_NOTICES.md`

アセットを再利用・再配布する場合は、上記に記載された提供元の利用規約・ライセンスに従い、必要なクレジット表記を行ってください。
