// apps/user/app/api/results/[resultId]/route.ts
import { auth } from "@clerk/nextjs/server";
import { DrizzleResultRepository } from "@infra/drizzle/repositories/resultRepository";
import { DrizzleUserRepository } from "@infra/drizzle/repositories/userRepository";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ResultOutput = {
	ok: true;
	resultId: string;
	passed: number;
	total: number;
	output?: unknown;
	taskId: string;
	createdAt: string;
};

type ResultError = { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function extractOutput(submittedProgram: unknown): unknown {
	if (!isRecord(submittedProgram)) return undefined;
	return "output" in submittedProgram ? submittedProgram.output : undefined;
}

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
	_req: Request,
	ctx: { params: Promise<{ resultId: string }> },
) {
	try {
		const { resultId } = await ctx.params;
		if (!resultId || !UUID_RE.test(resultId)) {
			return NextResponse.json(
				{ ok: false, error: "Invalid resultId" } satisfies ResultError,
				{ status: 400 },
			);
		}

		const { userId: authUserId } = await auth();
		if (!authUserId) {
			return NextResponse.json(
				{ ok: false, error: "Unauthorized" } satisfies ResultError,
				{ status: 401 },
			);
		}

		// Clerk userId → internal users.id に変換（evaluate と同じ方式）
		const userRepo = new DrizzleUserRepository();
		const appUser = await userRepo.findByAuthUserId(authUserId);
		if (!appUser) {
			return NextResponse.json(
				{ ok: false, error: "Not found" } satisfies ResultError,
				{ status: 404 },
			);
		}

		const repository = new DrizzleResultRepository();
		const result = await repository.findById(resultId);
		if (!result) {
			return NextResponse.json(
				{ ok: false, error: "Not found" } satisfies ResultError,
				{ status: 404 },
			);
		}

		if (result.userId !== appUser.id) {
			return NextResponse.json(
				{ ok: false, error: "Not found" } satisfies ResultError,
				{ status: 404 },
			);
		}

		const response: ResultOutput = {
			ok: true,
			resultId: result.id,
			passed: result.resultStatus ? 1 : 0,
			total: 1,
			output: extractOutput(result.submittedProgram),
			taskId: result.taskId,
			createdAt: result.createdAt.toISOString(),
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		console.error("GET /api/results/[resultId] error:", error);
		return NextResponse.json(
			{ ok: false, error: "Internal Server Error" } satisfies ResultError,
			{ status: 500 },
		);
	}
}
