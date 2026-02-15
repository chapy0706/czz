// apps/admin/app/api/admin/tasks/[taskId]/route.ts
import { NextResponse } from "next/server";
import {
	apiError,
	apiOk,
	type TaskDto,
	updateTaskInputSchema,
} from "@/lib/contracts/taskContract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequiredEnv(name: string): string {
	const v = process.env[name];
	if (!v) throw new Error(`Missing env: ${name}`);
	return v;
}

function requireAdminToken(req: Request): NextResponse | null {
	const expected = getRequiredEnv("ADMIN_TOKEN");
	const actual = req.headers.get("x-admin-token");
	if (!actual || actual !== expected) {
		return NextResponse.json(apiError("unauthorized", "Unauthorized"), {
			status: 401,
		});
	}
	return null;
}

function parseJsonField(value: unknown, field: string) {
	if (typeof value !== "string") return { ok: true, value };
	try {
		return { ok: true, value: JSON.parse(value) };
	} catch (error) {
		return {
			ok: false,
			error: apiError("invalid_json", `${field} is invalid JSON.`, {
				message: error instanceof Error ? error.message : String(error),
			}),
		};
	}
}

function toTaskDto(task: {
	id: string;
	title: string;
	description: string;
	dslProgram: unknown;
	testCases: unknown;
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}): TaskDto {
	return {
		id: task.id,
		title: task.title,
		description: task.description,
		dslProgram: task.dslProgram,
		testCases: task.testCases,
		isPublished: task.isPublished,
		createdAt: task.createdAt.toISOString(),
		updatedAt: task.updatedAt.toISOString(),
	};
}

async function getRepository() {
	const { DrizzleTaskRepository } = await import(
		"../../../../../../../infra/drizzle/repositories/taskRepository"
	);
	return new DrizzleTaskRepository();
}

type Params = { params: { taskId: string } };

export async function GET(req: Request, { params }: Params) {
	try {
		const unauth = requireAdminToken(req);
		if (unauth) return unauth;

		const repository = await getRepository();
		const task = await repository.findById(params.taskId);
		if (!task) {
			return NextResponse.json(apiError("not_found", "Task not found."), {
				status: 404,
			});
		}
		return NextResponse.json(apiOk(toTaskDto(task)));
	} catch (error) {
		console.error("GET /api/admin/tasks/[taskId] error:", error);
		return NextResponse.json(apiError("internal_error", "Internal error."), {
			status: 500,
		});
	}
}

export async function PATCH(req: Request, { params }: Params) {
	try {
		const unauth = requireAdminToken(req);
		if (unauth) return unauth;

		const json = await req.json().catch(() => null);
		const parsed = updateTaskInputSchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json(
				apiError("invalid_request", "Invalid request.", parsed.error.flatten()),
				{ status: 400 },
			);
		}

		const next = { ...parsed.data };
		if ("dslProgram" in next) {
			const dslResult = parseJsonField(next.dslProgram, "dslProgram");
			if (!dslResult.ok) {
				return NextResponse.json(dslResult.error, { status: 400 });
			}
			next.dslProgram = dslResult.value;
		}
		if ("testCases" in next) {
			const testResult = parseJsonField(next.testCases, "testCases");
			if (!testResult.ok) {
				return NextResponse.json(testResult.error, { status: 400 });
			}
			next.testCases = testResult.value;
		}

		const repository = await getRepository();
		const updated = await repository.update(params.taskId, next);
		if (!updated) {
			return NextResponse.json(apiError("not_found", "Task not found."), {
				status: 404,
			});
		}
		return NextResponse.json(apiOk(toTaskDto(updated)));
	} catch (error) {
		console.error("PATCH /api/admin/tasks/[taskId] error:", error);
		return NextResponse.json(apiError("internal_error", "Internal error."), {
			status: 500,
		});
	}
}

export async function DELETE(req: Request, { params }: Params) {
	try {
		const unauth = requireAdminToken(req);
		if (unauth) return unauth;

		const repository = await getRepository();
		const ok = await repository.delete(params.taskId);
		if (!ok) {
			return NextResponse.json(apiError("not_found", "Task not found."), {
				status: 404,
			});
		}
		return NextResponse.json(apiOk({ id: params.taskId }));
	} catch (error) {
		console.error("DELETE /api/admin/tasks/[taskId] error:", error);
		return NextResponse.json(apiError("internal_error", "Internal error."), {
			status: 500,
		});
	}
}
