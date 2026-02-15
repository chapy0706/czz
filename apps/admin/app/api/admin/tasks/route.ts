// apps/admin/app/api/admin/tasks/route.ts
import { NextResponse } from "next/server";
import {
	apiError,
	apiOk,
	createTaskInputSchema,
	type TaskDto,
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
		"../../../../../../infra/drizzle/repositories/taskRepository"
	);
	return new DrizzleTaskRepository();
}

export async function GET(req: Request) {
	try {
		const unauth = requireAdminToken(req);
		if (unauth) return unauth;

		const repository = await getRepository();
		const tasks = await repository.findAll();
		return NextResponse.json(apiOk(tasks.map(toTaskDto)));
	} catch (error) {
		console.error("GET /api/admin/tasks error:", error);
		return NextResponse.json(apiError("internal_error", "Internal error."), {
			status: 500,
		});
	}
}

export async function POST(req: Request) {
	try {
		const unauth = requireAdminToken(req);
		if (unauth) return unauth;

		const json = await req.json().catch(() => null);
		const parsed = createTaskInputSchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json(
				apiError("invalid_request", "Invalid request.", parsed.error.flatten()),
				{ status: 400 },
			);
		}

		const dslResult = parseJsonField(parsed.data.dslProgram, "dslProgram");
		if (!dslResult.ok) {
			return NextResponse.json(dslResult.error, { status: 400 });
		}

		const testResult = parseJsonField(parsed.data.testCases, "testCases");
		if (!testResult.ok) {
			return NextResponse.json(testResult.error, { status: 400 });
		}

		const repository = await getRepository();
		const task = await repository.create({
			title: parsed.data.title,
			description: parsed.data.description,
			isPublished: parsed.data.isPublished,
			dslProgram: dslResult.value,
			testCases: testResult.value,
			createdByUserId: "00000000-0000-0000-0000-000000000000",
		});

		return NextResponse.json(apiOk(toTaskDto(task)), { status: 201 });
	} catch (error) {
		console.error("POST /api/admin/tasks error:", error);
		return NextResponse.json(apiError("internal_error", "Internal error."), {
			status: 500,
		});
	}
}
