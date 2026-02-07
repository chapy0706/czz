import type { NewResult, Result, ResultRepository } from "@czz/domain";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { results } from "../schema";

export class DrizzleResultRepository implements ResultRepository {
	async create(input: NewResult): Promise<Result> {
		const inserted = await db
			.insert(results)
			.values({
				userId: input.userId,
				taskId: input.taskId,
				submittedProgram: input.submittedProgram,
				resultStatus: input.resultStatus ? 1 : 0,
			})
			.returning();

		const row = inserted[0];

		return {
			id: row.id,
			taskId: row.taskId,
			userId: row.userId,
			submittedProgram: row.submittedProgram, // ← 追加
			resultStatus: row.resultStatus === 1,
			createdAt: row.createdAt,
		};
	}

	async findById(id: string): Promise<Result | null> {
		const rows = await db.select().from(results).where(eq(results.id, id));
		const row = rows[0];
		if (!row) return null;

		return {
			id: row.id,
			taskId: row.taskId,
			userId: row.userId,
			submittedProgram: row.submittedProgram, // ← 追加
			resultStatus: row.resultStatus === 1,
			createdAt: row.createdAt,
		};
	}
}
