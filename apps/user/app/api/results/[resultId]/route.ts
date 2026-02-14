// apps/user/app/api/results/[resultId]/route.ts
import { DrizzleResultRepository } from "@infra/drizzle/repositories/resultRepository";
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

export async function GET(
	_req: Request,
	{ params }: { params: { resultId: string } },
) {
	const repository = new DrizzleResultRepository();
	const result = await repository.findById(params.resultId);
	if (!result) {
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
}
