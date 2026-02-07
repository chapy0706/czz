// infra/drizzle/repositories/taskRepository.ts
import type { Task, TaskId } from "@czz/domain/entities/task";
import type { TaskRepository } from "@czz/domain/repositories/taskRepository";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { tasks } from "../schema";

export class DrizzleTaskRepository implements TaskRepository {
	async findById(id: TaskId): Promise<Task | null> {
		const rows = await db.select().from(tasks).where(eq(tasks.id, id));
		const row = rows[0];
		if (!row) return null;

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

	// ここは Issue3 では不要なら一旦 throw でOK（ただし interface に必要なら）
	async findPublished(): Promise<Task[]> {
		const rows = await db.select().from(tasks).where(eq(tasks.isPublished, 1));
		return rows.map((row) => ({
			id: row.id,
			title: row.title,
			description: row.description,
			dslProgram: row.dslProgram,
			testCases: row.testCases,
			createdByUserId: row.createdByUserId,
			isPublished: true,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		}));
	}

	async create(): Promise<Task> {
		throw new Error("Not implemented");
	}
}
