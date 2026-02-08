// apps/user/app/api/admin/tasks/route.ts

import { DrizzleTaskRepository } from "@infra/drizzle/repositories/taskRepository";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CreateTaskUseCase } from "@/usecases/createTask";

export const runtime = "nodejs";

const createTaskBodySchema = z.object({
	title: z.string().min(1).max(200),
	description: z.string().min(1).max(2000),
	isPublished: z.boolean(),
	// DSL / TestCases は JSON なら何でもOK（詳細検証は UseCase 側に寄せる）
	dslProgram: z.unknown(),
	testCases: z.unknown(),
	// 認証導入前なのでオプション扱い
	createdByUserId: z.string().uuid().optional(),
});

function getRequiredEnv(name: string): string {
	const v = process.env[name];
	if (!v) throw new Error(`Missing env: ${name}`);
	return v;
}

function requireAdminToken(req: Request): NextResponse | null {
	const expected = getRequiredEnv("ADMIN_API_TOKEN");
	const actual = req.headers.get("x-admin-token");

	if (!actual || actual !== expected) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	return null;
}

export async function POST(request: Request) {
	try {
		const unauth = requireAdminToken(request);
		if (unauth) return unauth;

		const json = await request.json().catch(() => null);

		const parseResult = createTaskBodySchema.safeParse(json);
		if (!parseResult.success) {
			return NextResponse.json(
				{
					error: "invalid_request",
					details: parseResult.error.flatten(),
				},
				{ status: 400 },
			);
		}

		const body = parseResult.data;

		// UseCase（Application）に寄せる：Route は入力境界＋認可＋呼び出しだけ
		const repository = new DrizzleTaskRepository();
		const useCase = new CreateTaskUseCase(repository);

		const task = await useCase.execute({
			title: body.title,
			description: body.description,
			isPublished: body.isPublished,
			dslProgram: body.dslProgram,
			testCases: body.testCases,
			createdByUserId: body.createdByUserId,
		});

		// admin UI が期待する形：taskId を返す
		return NextResponse.json(
			{
				taskId: task.id,
				task: {
					id: task.id,
					title: task.title,
					description: task.description,
					isPublished: task.isPublished,
					createdAt: task.createdAt,
					updatedAt: task.updatedAt,
				},
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("POST /api/admin/tasks error:", error);

		// 運用上は詳細を返しすぎない（ログで追う）
		return NextResponse.json(
			{ error: "internal_server_error" },
			{ status: 500 },
		);
	}
}
