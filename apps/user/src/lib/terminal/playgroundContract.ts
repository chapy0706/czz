// apps/user/src/lib/terminal/playgroundContract.ts
import { z } from "zod";

export const PlaygroundRequestSchema = z.object({
	debugInput: z.array(z.number().finite()).min(0).max(50),
	submittedProgram: z.unknown(), // コマンド列はサーバ側で “安全に” 解釈する
});

export const PlaygroundResponseOkSchema = z.object({
	ok: z.literal(true),
	output: z.array(z.number().finite()).max(50),
});

export const PlaygroundResponseErrSchema = z.object({
	ok: z.literal(false),
	error: z.object({
		message: z.string(),
		details: z.unknown().optional(),
	}),
});

export const PlaygroundResponseSchema = z.union([
	PlaygroundResponseOkSchema,
	PlaygroundResponseErrSchema,
]);

export type PlaygroundRequest = z.infer<typeof PlaygroundRequestSchema>;
export type PlaygroundResponse = z.infer<typeof PlaygroundResponseSchema>;
