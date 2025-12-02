# czz コーディング規約

本ドキュメントは czz プロジェクトのコーディング規約のドラフトであり、  
UNIX 哲学と SOLID 原則、クリーンアーキテクチャの考え方をベースとしている。

- 小さく・単純に・単一責務
- 型安全を最優先
- 抽象への依存（インターフェイス）を基本とする
- UI / UseCase / Domain / Infrastructure を明確に分離する

---

## 1. レイヤ構造と依存関係

### 1-1. レイヤ定義

czz では次の 4 レイヤを意識する。

- Presentation（Interface）
  - Next.js の API Route / React コンポーネント
  - 例: `apps/user/app/**`, `apps/admin/app/**`
- Application（ユースケース層）
  - ユースケース（業務フロー）を実装する層
  - 例: `apps/user/src/usecases/**`
- Domain
  - ビジネスルール・エンティティ・ドメインサービス・Repository インターフェイス
  - 例: `packages/domain/src/**`
- Infrastructure
  - Drizzle ORM / PostgreSQL など具体的な外部システムへの実装
  - 例: `apps/user/src/repositories/**`, `infra/drizzle/**`

### 1-2. 依存方向

依存方向は内向きのみとする。

- Infrastructure → Application → Domain
- Presentation → Application → Domain
- Domain は他のレイヤに依存してはならない

禁止事項の例:

- Domain 層から Drizzle や Next.js を import する
- UseCase が Next.js の Request/Response 型に依存する
- React コンポーネントから直接 Drizzle を使う

---

## 2. SOLID 原則に基づくルール

### 2-1. S: 単一責任の原則（Single Responsibility）

- クラス・関数は「1 つの責務」に絞る。
- 以下は混ぜないこと:
  - Repository にドメインロジック（ビジネスルール）を書かない
  - UseCase に HTTP の詳細（レスポンス整形）を書かない
  - API Route に複雑なビジネスロジックを書かない
- 目安:
  - ファイルが 200 行を超えたら「責務分割」を検討する
  - 関数が 30 行を超えたら内部で更に関数分割を検討する

### 2-2. O: 開放/閉鎖の原則（Open/Closed）

- 機能追加はなるべく「クラスや関数を追加する」形で行い、既存コードの変更を最小限にする。
- Repository や UseCase は、拡張しやすい抽象インターフェイスを持つ。
- 新しいユースケースを追加するときは、新しい UseCase クラス/関数を追加する。

### 2-3. L: リスコフ置換原則（Liskov Substitution）

- Repository 実装は、Repository インターフェイスの仕様を正確に守る。
  - 例: `findById` は「見つからない場合は null を返す」契約を全実装で統一する。
- テストではインメモリ実装と Drizzle 実装を入れ替えても UseCase が動くことを目標とする。

### 2-4. I: インターフェイス分離の原則（Interface Segregation）

- エンティティごとに Repository インターフェイスを分ける。
  - 例: `TaskRepository`, `UserRepository`, `ResultRepository`
- 1 つのインターフェイスに多機能を詰め込みすぎない。
  - 必要に応じて `ReadableTaskRepository` / `WritableTaskRepository` のように分割することも検討する。

### 2-5. D: 依存性逆転の原則（Dependency Inversion）

- Application 層は「インターフェイス（抽象）」に依存し、「具象（実装）」には依存しない。
  - 例: UseCase のコンストラクタには `TaskRepository` インターフェイスを受け取る。
- 具象の組み立て（Drizzle 実装の new）は Presentation 層または専用の Factory 関数で行う。
  - 例: API Route 内で `new DrizzleTaskRepository()` → UseCase に渡す。

---

## 3. TypeScript / 型設計

- `any` の使用は禁止とする（どうしても必要な場合は TODO コメントを必ず付ける）。
- ドメイン型は `packages/domain` に集約し、他レイヤから参照する。
- API の入出力型は `packages/types` にまとめ、Zod スキーマと対応させる。
- Union 型・Literal 型を積極的に使用し、「取りうる値の範囲」を型で表現する。
- `null` と `undefined` は明確に使い分ける。
  - 「存在しない」可能性は `null` で表現する（例: `Task | null`）。
  - 「まだ読み込まれていない」状態は `undefined` を用いて UI 側で扱う。

---

## 4. UseCase 設計ルール

- UseCase は 1 ユースケースにつき 1 クラスまたは 1 関数とする。
  - 例: `ListPublishedTasksUseCase`, `CreateTaskUseCase`
- UseCase の責務:
  - Repository からデータ取得・保存を行う。
  - Domain ロジックを組み合わせ、ユースケース全体を完結させる。
- UseCase は HTTP・UI・React・Next.js 型に依存しない。
  - 入出力はドメイン型またはシンプルな DTO（データ転送オブジェクト）とする。
- エラーは `Result` 型や独自のエラークラスを使うか、スローした上で API 層で HTTP ステータスに変換する。

---

## 5. Repository 設計ルール

- Domain 層に Repository インターフェイスを定義する。
  - 例: `TaskRepository` インターフェイス
- Infrastructure 層で Drizzle を用いた具象クラスを実装する。
  - 例: `DrizzleTaskRepository implements TaskRepository`
- Repository の命名:
  - インターフェイス: `TaskRepository`
  - Drizzle 実装: `DrizzleTaskRepository`
- Repository 実装は以下に集中する:
  - DB スキーマとドメインモデルの相互変換
  - クエリの発行
- Repository にビジネスロジックを置かない。
  - 例: `isPublished` 状態の解釈、DSL の評価などは Domain / UseCase に置く。

---

## 6. Presentation 層（API / React）ルール

### 6-1. API Route

- Next.js の API Route では以下の責務のみに絞る:
  - HTTP Request の受付
  - Zod による入力バリデーション
  - UseCase の呼び出し
  - 結果の JSON 変換と HTTP ステータス決定
- ビジネスロジックは必ず UseCase 包含に委譲する。
- try/catch でエラーを捕捉し、HTTP レスポンスに変換する。

### 6-2. React コンポーネント

- 状態管理は Zustand / SWR を用い、ロジックを hooks に切り出す。
- コンポーネントは可能な限り「見た目」に集中させる（Presentational Component）。
- ビジネスロジックやデータ取得を伴うものは専用の hooks に切り出す。
  - 例: `useTaskList`, `useTaskExecution`

---

## 7. エラーハンドリング

- Zod によるスキーマバリデーションを境界（API, DB 入出力など）ごとに設ける。
- API Route では:
  - 入力エラー: 400 Bad Request
  - 認可エラー: 401/403
  - 想定外のエラー: 500 Internal Server Error
- エラーはログ出力時に機微情報（パスワード、トークンなど）を含めないよう注意する。

---

## 8. テスト方針

- 単体テスト: Vitest を使用する。
  - Domain サービス（DSL 評価ロジックなど）を最優先でテストする。
  - Repository はインメモリ実装を用意し、UseCase テスト時に注入する。
- 結合テスト:
  - Drizzle + PostgreSQL を用いた Repository のテストを必要に応じて作成する。
- E2E テスト:
  - Playwright により、実際のブラウザ操作に近いシナリオテストを行う。
  - ゲームの基本フロー（課題を選ぶ → 指示を並べる → 実行 → 結果確認）を一通りカバーする。

---

## 9. 命名規則

- ファイル名:
  - TypeScript: `camelCase` または `kebab-case`（プロジェクト内で統一）
  - React コンポーネント: `PascalCase.tsx`
- クラス名: `PascalCase`
- 関数名: `camelCase`
- 型・インターフェイス名: `PascalCase`（`I` プレフィックスは付けない）
- フック: `useSomething` で始める。

---

## 10. Git 運用

- コミットメッセージは簡潔かつ内容がわかる英語または日本語で記述する。
  - 例: `feat: add ListPublishedTasksUseCase`
  - 例: `fix: task repository mapping bug`
- 大きな機能はブランチを切って作業し、Pull Request を通じてマージすることを推奨する。

---

本ドキュメントはドラフトであり、実装を進めながら随時アップデートしていく。
