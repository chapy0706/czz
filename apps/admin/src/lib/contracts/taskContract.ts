// apps/admin/src/lib/contracts/taskContract.ts
import { z } from "zod";

export type ApiError = {
	code: string;
	message: string;
	details?: unknown;
};

export type ApiResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: ApiError };

export function apiOk<T>(data: T): ApiResult<T> {
	return { ok: true, data };
}

export function apiError(
	code: string,
	message: string,
	details?: unknown,
): ApiResult<never> {
	return { ok: false, error: { code, message, details } };
}

export const taskDtoSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	dslProgram: z.unknown(),
	testCases: z.unknown(),
	isPublished: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export type TaskDto = z.infer<typeof taskDtoSchema>;

export const createTaskInputSchema = z.object({
	title: z.string().min(1).max(120),
	description: z.string().max(4000),
	dslProgram: z.unknown(),
	testCases: z.unknown(),
	isPublished: z.boolean(),
});

export const updateTaskInputSchema = createTaskInputSchema
	.partial()
	.refine((value) => Object.keys(value).length > 0, {
		message: "No fields to update.",
	});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;
