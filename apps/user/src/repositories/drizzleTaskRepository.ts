// apps/user/src/repositories/drizzleTaskRepository.ts

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { tasks } from "../../../../infra/drizzle/schema";

import type { NewTask, Task } from "@czz/domain/entities/task";
import type { TaskRepository } from "@czz/domain/repositories/taskRepository";

// Drizzle が推論した INSERT 用の型
type TaskInsert = typeof tasks.$inferInsert;
type TaskRow = typeof tasks.$inferSelect;

function toDomainTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    // DB は 0/1 フラグ、Domain は boolean
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

  async create(input: NewTask): Promise<Task> {
    const now = new Date();

    // Drizzle の INSERT 型に寄せたオブジェクトを一旦変数にする
    const insertValue: TaskInsert = {
      title: input.title,
      description: input.description,
      dslProgram: input.dslProgram as TaskInsert["dslProgram"],
      testCases: input.testCases as TaskInsert["testCases"],
      createdByUserId: input.createdByUserId as TaskInsert["createdByUserId"],
    };

    const [row] = await db
      .insert(tasks)
      .values(insertValue as TaskInsert)
      .returning();

    return toDomainTask(row);
  }
}
