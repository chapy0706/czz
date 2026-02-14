// infra/drizzle/repositories/taskRepository.ts
import type {
	NewTask,
	Task,
	TaskId,
	UpdateTask,
} from "@czz/domain/entities/task";
import type { TaskRepository } from "@czz/domain/repositories/taskRepository";
import { desc, eq } from "drizzle-orm";

import { db } from "../db";
import { tasks } from "../schema";

export class DrizzleTaskRepository implements TaskRepository {
	private rowToTask(row: typeof tasks.$inferSelect): Task {
		return {
			id: row.id,
			title: row.title,
			description: row.description,
			dslProgram: row.dslProgram,
			testCases: row.testCases,
			createdByUserId: row.createdByUserId,
			isPublished: row.isPublished === 1,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}

	async findAll(): Promise<Task[]> {
		const rows = await db.select().from(tasks).orderBy(desc(tasks.updatedAt));
		return rows.map((row) => this.rowToTask(row));
	}

	async findById(id: TaskId): Promise<Task | null> {
		const rows = await db.select().from(tasks).where(eq(tasks.id, id));
		const row = rows[0];
		if (!row) return null;

		return this.rowToTask(row);
	}

	// ここは Issue3 では不要なら一旦 throw でOK（ただし interface に必要なら）
	async findPublished(): Promise<Task[]> {
		const rows = await db.select().from(tasks).where(eq(tasks.isPublished, 1));
		return rows.map((row) => this.rowToTask(row));
	}

	async create(input: NewTask): Promise<Task> {
		const rows = await db
			.insert(tasks)
			.values({
				title: input.title,
				description: input.description,
				dslProgram: input.dslProgram,
				testCases: input.testCases,
				isPublished: input.isPublished ? 1 : 0,
				createdByUserId: input.createdByUserId,
			})
			.returning();
		const row = rows[0];
		if (!row) throw new Error("Failed to create task");
		return this.rowToTask(row);
	}

	async update(id: TaskId, input: UpdateTask): Promise<Task | null> {
		const next: Partial<typeof tasks.$inferInsert> = {};
		if (input.title !== undefined) next.title = input.title;
		if (input.description !== undefined) next.description = input.description;
		if (input.dslProgram !== undefined) next.dslProgram = input.dslProgram;
		if (input.testCases !== undefined) next.testCases = input.testCases;
		if (input.isPublished !== undefined)
			next.isPublished = input.isPublished ? 1 : 0;

		if (Object.keys(next).length === 0) {
			return this.findById(id);
		}

		next.updatedAt = new Date();

		const rows = await db
			.update(tasks)
			.set(next)
			.where(eq(tasks.id, id))
			.returning();
		const row = rows[0];
		if (!row) return null;
		return this.rowToTask(row);
	}

	async delete(id: TaskId): Promise<boolean> {
		const rows = await db.delete(tasks).where(eq(tasks.id, id)).returning();
		return rows.length > 0;
	}
}
