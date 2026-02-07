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
	}),
]);

export type EvaluateResponse = z.infer<typeof EvaluateResponseSchema>;
