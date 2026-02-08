// apps/user/src/lib/terminal/evaluateClient.ts
import {
	type EvaluateResponse,
	EvaluateResponseSchema,
	extractResultId,
} from "@/lib/terminal/evaluateContract";
import type { RunnerIo } from "@/lib/terminal/runnerIo";

type Params = {
	taskId: string;
	userId?: string;
	submittedProgram: unknown;

	// Runner の入出力（“両端□”）
	runnerIo?: RunnerIo;

	// 将来/別用途用（Playground 等はここを使っても evaluate API と分離できる）
	debugInput?: unknown;
	dryRun?: boolean;
	purpose?: "evaluate" | "debug";
};

export async function evaluateTask(params: Params): Promise<EvaluateResponse> {
	try {
		const res = await fetch(`/api/tasks/${params.taskId}/evaluate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				userId: params.userId,
				submittedProgram: params.submittedProgram,
				runnerIo: params.runnerIo,
				debugInput: params.debugInput,
				dryRun: params.dryRun,
				purpose: params.purpose,
			}),
		});

		const json = await res.json().catch(() => null);

		const parsed = EvaluateResponseSchema.safeParse(json);
		if (parsed.success) {
			const extracted = extractResultId(json);
			return extracted && !parsed.data.resultId
				? { ...parsed.data, resultId: extracted }
				: parsed.data;
		}

		return {
			ok: false,
			error: {
				kind: "UNKNOWN",
				message: "Invalid response shape",
				details: parsed.error.flatten(),
			},
			resultId: extractResultId(json) ?? undefined,
		};
	} catch (e) {
		return {
			ok: false,
			error: {
				kind: "NETWORK",
				message: "Network error",
				details: e,
			},
		};
	}
}
