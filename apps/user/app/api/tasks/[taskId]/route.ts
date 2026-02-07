// apps/user/app/api/tasks/[taskId]/route.ts
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { tasks } from "@infra/drizzle/schema";

/**
 * GET /api/tasks/[taskId]
 * タスク詳細（title/description/dslProgram/testCases/isPublished）を返す。
 *
 * Next.js 16+ の Route Handler 型に合わせて、ctx.params は Promise 扱いにする。
 */
const paramsSchema = z.object({
	taskId: z.string().uuid(),
});

export async function GET(
	_req: NextRequest,
	ctx: { params: Promise<{ taskId: string }> },
) {
	try {
		const { taskId } = paramsSchema.parse(await ctx.params);

		const rows = await db
			.select({
				id: tasks.id,
				title: tasks.title,
				description: tasks.description,
				dslProgram: tasks.dslProgram,
				testCases: tasks.testCases,
				isPublished: tasks.isPublished,
				createdAt: tasks.createdAt,
				updatedAt: tasks.updatedAt,
			})
			.from(tasks)
			.where(eq(tasks.id, taskId))
			.limit(1);

		const task = rows[0];
		if (!task) {
			return NextResponse.json(
				{ ok: false, error: { kind: "NOT_FOUND", message: "Task not found" } },
				{ status: 404 },
			);
		}

		// 本番: 未公開を返さない（URL直打ちの漏れを最小化）
		if (
			process.env.NODE_ENV === "production" &&
			Number(task.isPublished) !== 1
		) {
			return NextResponse.json(
				{ ok: false, error: { kind: "NOT_FOUND", message: "Task not found" } },
				{ status: 404 },
			);
		}

		return NextResponse.json({ ok: true, task }, { status: 200 });
	} catch (e) {
		if (e instanceof z.ZodError) {
			return NextResponse.json(
				{ ok: false, error: { kind: "BAD_REQUEST", details: e.flatten() } },
				{ status: 400 },
			);
		}

		const message = e instanceof Error ? e.message : "Unknown error";
		return NextResponse.json(
			{ ok: false, error: { kind: "UNKNOWN", message } },
			{ status: 500 },
		);
	}
}
