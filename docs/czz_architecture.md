# czz アーキテクチャ概要（ライト版クリーンアーキテクチャ）

## 1. コンセプト

czz では、以下の4つのレイヤーを意識した「ライト版クリーンアーキテクチャ」を採用する。

- Domain（ドメイン層）
  - czz の中核となる概念（Task / User / Result / DSL 評価ロジック）
  - ビジネスルール、制約、ドメインサービス
- Application（ユースケース層）
  - ユースケース（タスク一覧取得、評価実行、結果保存など）
  - 複数の Repository やドメインサービスを組み合わせて処理を完結させる
- Interface / Presentation（インターフェース層）
  - Next.js の API Route / React コンポーネント
  - HTTP リクエスト/レスポンスや画面入力と Domain/Application をつなぐ
- Infrastructure（インフラ層）
  - Drizzle ORM / PostgreSQL / 外部サービス
  - Repository インターフェイスの具体実装

依存方向は以下のように「内向きのみ」を基本とする。

- Infrastructure → Application → Domain
- Presentation → Application → Domain
- Domain は他レイヤーに依存しない

```
+-------------------------+
|   Presentation (Next)   |
|   - app/* (user/admin) |
+-----------+-------------+
            |
            v
+-------------------------+
|  Application (UseCases) |
|  - usecases/*           |
+-----------+-------------+
            |
            v
+-------------------------+
|    Domain (Entities)    |
|  - Task/User/Result     |
|  - DSL Evaluator        |
+-----------+-------------+
            ^
            |
+-------------------------+
| Infrastructure (DB etc) |
| - Drizzle Repositories  |
+-------------------------+
```

---

## 2. ディレクトリ構成（例）

czz リポジトリ全体の構成例は次の通りとする。

```txt
czz/
  apps/
    user/
      app/
        api/
          health/route.ts
          tasks/route.ts
      src/
        lib/
          db.ts
        repositories/
          drizzleTaskRepository.ts
          drizzleUserRepository.ts
        usecases/
          listPublishedTasks.ts
          createTask.ts
    admin/
      app/
        tasks/new/page.tsx
      src/
        usecases/
        repositories/

  packages/
    domain/
      src/
        entities/
          task.ts
          user.ts
          result.ts
        repositories/
          taskRepository.ts
          userRepository.ts
        services/
          evaluateTask.ts
    dsl-core/
      src/
        dsl.ts
    types/
      src/
        api.ts

  infra/
    drizzle/
      schema.ts
      migrations/

    docker/
      docker-compose.dev.yml

  docs/
    architecture.md
    coding-guidelines.md
```

---

## 3. レイヤ別の役割整理

### 3-1. Domain 層（packages/domain）

- エンティティ、値オブジェクト、ドメインサービス
- DB や HTTP のことは知らない
- Repository のインターフェイスを保持

### 3-2. Application 層（usecases）

- ユースケースごとのアプリケーションサービス
- Repository インターフェイスにのみ依存
- ドメインロジックを組み合わせて処理を完結

### 3-3. Presentation 層（apps/user, apps/admin）

- Next.js API Route
- React コンポーネント
- UI と UseCase をつなぐ

### 3-4. Infrastructure 層（Drizzle, PostgreSQL）

- Drizzle ORM 実装
- DB に依存する Repository 実装

---

## 4. 具体的なコード例

### 4-1. Domain: Task エンティティ

```ts
export type TaskId = string;

export interface Task {
  id: TaskId;
  title: string;
  description: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 4-2. Domain: TaskRepository インターフェイス

```ts
import type { Task, TaskId } from "../entities/task";

export interface TaskCreateInput {
  title: string;
  description: string;
  isPublished: boolean;
}

export interface TaskRepository {
  findPublished(): Promise<Task[]>;
  findById(id: TaskId): Promise<Task | null>;
  create(input: TaskCreateInput): Promise<Task>;
}
```

---

### 4-3. Infrastructure: DrizzleTaskRepository 実装

```ts
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "../../../../infra/drizzle/schema";
import type {
  TaskRepository,
  TaskCreateInput,
} from "@czz/domain/repositories/taskRepository";
import type { Task } from "@czz/domain/entities/task";

function toDomainTask(row: typeof tasks.$inferSelect): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    isPublished: row.isPublished === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleTaskRepository implements TaskRepository {
  async findPublished(): Promise<Task[]> {
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.isPublished, 1));
    return rows.map(toDomainTask);
  }

  async findById(id: string): Promise<Task | null> {
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return toDomainTask(row);
  }

  async create(input: TaskCreateInput): Promise<Task> {
    const now = new Date();
    const [row] = await db
      .insert(tasks)
      .values({
        title: input.title,
        description: input.description,
        isPublished: input.isPublished ? 1 : 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return toDomainTask(row);
  }
}
```

---

### 4-4. Application: ListPublishedTasksUseCase

```ts
import type { TaskRepository } from "@czz/domain/repositories/taskRepository";
import type { Task } from "@czz/domain/entities/task";

export class ListPublishedTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(): Promise<Task[]> {
    return this.taskRepository.findPublished();
  }
}
```

---

### 4-5. Presentation: Next.js API Route (/api/tasks)

```ts
import { NextResponse } from "next/server";
import { DrizzleTaskRepository } from "@/src/repositories/drizzleTaskRepository";
import { ListPublishedTasksUseCase } from "@/src/usecases/listPublishedTasks";

function createUseCase() {
  const repo = new DrizzleTaskRepository();
  return new ListPublishedTasksUseCase(repo);
}

export async function GET() {
  const useCase = createUseCase();
  try {
    const tasks = await useCase.execute();
    return NextResponse.json({
      tasks: tasks.map((task) => ({
        ...task,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to list tasks" }, { status: 500 });
  }
}
```

---

## 5. 今後の拡張の方向性

- DB を SQLite / Supabase / REST API に変更 → Repository 実装を差し替えるだけ
- SvelteKit / Remix / Astro に UI を移行 → Presentation 層だけ置き換え
- CLI やバッチ処理作成 → Domain と UseCase をそのまま利用可能
- マイクロサービス化 → Repository 呼び出し先を API 化すれば対応可能

czz のコアは Domain に集約されるため、長期的な拡張性が非常に高くなる。
