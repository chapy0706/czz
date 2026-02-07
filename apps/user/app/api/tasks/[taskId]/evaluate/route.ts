// apps/user/src/app/api/tasks/[taskId]/evaluate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { EvaluateResponseSchema } from "@/lib/terminal/evaluateContract";
import { REQUIRED_RUNNER_IO } from "@/lib/terminal/runnerIo";
import { EvaluateTaskUseCase } from "@/usecases/evaluateTask";

// infra
import { DrizzleResultRepository } from "@infra/drizzle/repositories/resultRepository";
import { DrizzleTaskRepository } from "@infra/drizzle/repositories/taskRepository";

const paramsSchema = z.object({ taskId: z.string().uuid() });

const runnerInputSchema = z.object({
	kind: z.literal("cat"),
	file: z.string(),
});
const runnerOutputSchema = z.object({
	kind: z.enum(["append", "overwrite"]),
	file: z.string(),
});
const runnerIoSchema = z.object({
	input: runnerInputSchema.nullable(),
	output: runnerOutputSchema.nullable(),
});

const requestSchema = z
	.object({
		userId: z.string().uuid().optional(),
		submittedProgram: z.unknown(),

		// Playground 等が将来ここを使っても壊れないように “受け口” は持っておく
		debugInput: z.unknown().optional(),
		dryRun: z.boolean().optional(),
		purpose: z.enum(["evaluate", "debug"]).optional(),

		// Runner の両端 I/O（学習用の追加要素）
		runnerIo: runnerIoSchema.optional(),
	})
	.passthrough();

export async function POST(
	req: Request,
	ctx: { params: Promise<{ taskId: string }> },
) {
	try {
		const { taskId } = paramsSchema.parse(await ctx.params);

		const body = await req.json();
		const parsed = requestSchema.parse(body);

		const isDebugLike =
			parsed.purpose === "debug" ||
			parsed.dryRun === true ||
			parsed.debugInput !== undefined;

		// --- Runner I/O チェック（evaluate のみ必須）---
		if (!isDebugLike) {
			const io = parsed.runnerIo;
			const expected = REQUIRED_RUNNER_IO;

			const missing = !io || !io.input || !io.output;
			const mismatch =
				!!io &&
				!!io.input &&
				!!io.output &&
				(io.input.kind !== expected.input.kind ||
					io.input.file !== expected.input.file ||
					io.output.kind !== expected.output.kind ||
					io.output.file !== expected.output.file);

			if (missing || mismatch) {
				const response = {
					ok: false,
					passed: 0,
					total: 1,
					error: {
						kind: "TEST",
						message: missing ? "Runner I/O is not set" : "Runner I/O mismatch",
						details: {
							expected,
							actual: io ?? null,
							help: "両端をクリックして Input=cat input.csv / Output=>> output.csv に合わせてね（出力自体は変わらないが、正解判定に必要）。",
						},
					},
				} as const;

				const normalized = EvaluateResponseSchema.safeParse(response);
				return NextResponse.json(
					normalized.success ? normalized.data : response,
					{ status: 200 },
				);
			}
		}

		const usecase = new EvaluateTaskUseCase({
			taskRepository: new DrizzleTaskRepository(),
			resultRepository: new DrizzleResultRepository(),
		});

		const result = await usecase.execute({
			taskId,
			userId: parsed.userId,
			submittedProgram: parsed.submittedProgram,
		});

		// UseCase は runTestCases の結果を返す。
		// API 層で EvaluateResponse（契約）に正規化して返す。
		const any = result as any;
		const results = Array.isArray(any?.results) ? any.results : null;
		const total = results ? results.length : Number.NaN;
		const passed = results
			? results.filter((r: any) => r && r.passed === true).length
			: Number.NaN;
		const allPassed =
			typeof any?.allPassed === "boolean"
				? any.allPassed
				: results
					? passed === total
					: false;

		// “出力” は DSL の性質上いろいろありうるので、まずは「最後の actual」を採用
		const output =
			results && results.length > 0
				? results[results.length - 1]?.actual
				: undefined;

		if (
			!results ||
			!Number.isFinite(passed) ||
			!Number.isFinite(total) ||
			passed < 0 ||
			total < 0
		) {
			return NextResponse.json(
				{
					ok: false,
					error: {
						kind: "UNKNOWN",
						message: "Invalid runTestCases result shape",
						details: result,
					},
				},
				{ status: 500 },
			);
		}

		const response = allPassed
			? ({ ok: true, passed, total, output } as const)
			: ({
					ok: false,
					passed,
					total,
					error: {
						kind: "TEST",
						message: "Some test cases failed",
						details: { result },
					},
				} as const);

		const normalized = EvaluateResponseSchema.safeParse(response);
		if (!normalized.success) {
			return NextResponse.json(
				{
					ok: false,
					error: {
						kind: "UNKNOWN",
						message: "Invalid API response shape",
						details: normalized.error.flatten(),
					},
				},
				{ status: 500 },
			);
		}

		return NextResponse.json(normalized.data, { status: 200 });
	} catch (e) {
		if (e instanceof z.ZodError) {
			return NextResponse.json(
				{
					ok: false,
					error: {
						kind: "ZOD",
						message: "Bad Request",
						details: e.flatten(),
					},
				},
				{ status: 400 },
			);
		}

		const message = e instanceof Error ? e.message : "Unknown error";
		const status = message === "Task not found" ? 404 : 500;

		return NextResponse.json(
			{
				ok: false,
				error: {
					kind: "UNKNOWN",
					message,
					details: e,
				},
			},
			{ status },
		);
	}
}
