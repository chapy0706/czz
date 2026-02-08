// apps/user/src/lib/terminal/evaluateContract.ts
import { z } from "zod";

export const EvaluateRequestSchema = z
	.object({
		/**
		 * ゲスト実行では未指定でOK（保存しない・or サーバー側で guest 扱い）
		 */
		userId: z.string().uuid().optional(),

		/**
		 * { commands: [...] } など、DSLプログラム本体
		 * 詳細なスキーマはドメイン/DSL側で検証する
		 */
		submittedProgram: z.unknown(),

		/**
		 * Debug/Playground 用の入力（自由テキスト禁止。数列のみ）
		 */
		debugInput: z.array(z.number().int()).max(50).optional(),

		/**
		 * true の場合、結果の永続化を行わない「試運転」を要求する（サーバー側対応時のみ有効）
		 */
		dryRun: z.boolean().optional(),

		/**
		 * 実行の意図（サーバー側で分岐したい場合に使う）
		 */
		purpose: z.enum(["evaluate", "debug"]).optional(),
	})
	.strict();

export type EvaluateRequest = z.infer<typeof EvaluateRequestSchema>;

export const EvaluateResponseSchema = z.union([
	z.object({
		ok: z.literal(true),
		passed: z.number().int().nonnegative(),
		total: z.number().int().nonnegative(),
		output: z.unknown().optional(),

		/**
		 * 既存コードが参照している可能性があるため optional で残す
		 * サーバーが返さない場合は undefined
		 */
		resultId: z.string().uuid().optional(),
	}),
	z.object({
		ok: z.literal(false),
		error: z.object({
			kind: z.enum(["ZOD", "TEST", "NETWORK", "UNKNOWN"]),
			message: z.string(),
			details: z.unknown().optional(),
		}),
		passed: z.number().int().nonnegative().optional(),
		total: z.number().int().nonnegative().optional(),
		resultId: z.string().uuid().optional(),
	}),
]);

export type EvaluateResponse = z.infer<typeof EvaluateResponseSchema>;

export function extractResultId(payload: unknown): string | null {
	if (!payload || typeof payload !== "object") return null;

	const obj = payload as Record<string, unknown>;
	const direct = typeof obj.resultId === "string" ? obj.resultId : null;
	if (direct) return direct;

	const value = obj.value as Record<string, unknown> | undefined;
	if (value) {
		if (typeof value.resultId === "string" && value.resultId) {
			return value.resultId;
		}
		if (typeof value.id === "string" && value.id) return value.id;
		const result = value.result as Record<string, unknown> | undefined;
		if (result && typeof result.id === "string" && result.id) {
			return result.id;
		}
	}

	const result = obj.result as Record<string, unknown> | undefined;
	if (result && typeof result.id === "string" && result.id) {
		return result.id;
	}

	if (typeof obj.id === "string" && obj.id) return obj.id;

	return null;
}
