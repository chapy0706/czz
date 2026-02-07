// apps/user/src/usecases/evaluateTask.test.ts
import { describe, expect, it, vi } from "vitest";
import { EvaluateTaskUseCase } from "./evaluateTask";

import type { NewTask, Task, TaskId } from "@czz/domain/entities/task";
import type { TaskRepository } from "@czz/domain/repositories/taskRepository";

import type { Result, ResultId } from "@czz/domain/entities/result";
import type { ResultRepository } from "@czz/domain/repositories/resultRepository";

// ---- Fakes ----

class FakeTaskRepository implements TaskRepository {
	// 使わないメソッドは落としてOK（呼ばれたら気づける）
	findPublished(): Promise<Task[]> {
		throw new Error("Method not implemented.");
	}
	create(input: NewTask): Promise<Task> {
		throw new Error("Method not implemented.");
	}

	async findById(id: TaskId): Promise<Task> {
		return {
			id,
			title: "sample task",
			description: "desc",
			dslProgram: { type: "program", commands: [] },
			testCases: [{ input: [1, 2, 3], expected: [1, 2, 3] }],
			createdByUserId: "user-admin-1",
			isPublished: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
	}
}

class FakeResultRepository implements ResultRepository {
	create = vi.fn(async (input) => {
		const result: Result = {
			id: "result-1" as ResultId,
			taskId: input.taskId,
			userId: input.userId,
			submittedProgram: input.submittedProgram,
			resultStatus: input.resultStatus,
			createdAt: new Date(),
		};
		return result;
	});

	findById = vi.fn(async () => null);
}

// ---- Tests ----

describe("EvaluateTaskUseCase", () => {
	it("valid submittedProgram のとき ResultRepository.create が呼ばれる", async () => {
		const taskRepository = new FakeTaskRepository();
		const resultRepository = new FakeResultRepository();

		const usecase = new EvaluateTaskUseCase({
			taskRepository,
			resultRepository,
		});

		const validSubmittedProgram = { type: "program", commands: [] };

		const result = await usecase.execute({
			taskId: "task-1",
			userId: "user-1",
			submittedProgram: validSubmittedProgram,
		});

		expect(resultRepository.create).toHaveBeenCalledTimes(1);
		expect(resultRepository.create).toHaveBeenCalledWith(
			expect.objectContaining({
				taskId: "task-1",
				userId: "user-1",
				resultStatus: expect.any(Boolean),
				submittedProgram: expect.objectContaining({
					commands: expect.any(Array),
				}),
			}),
		);

		expect(result).toBeDefined();
	});

	it("invalid submittedProgram のとき create は呼ばれず例外になる", async () => {
		const taskRepository = new FakeTaskRepository();
		const resultRepository = new FakeResultRepository();

		const usecase = new EvaluateTaskUseCase({
			taskRepository,
			resultRepository,
		});

		const invalidSubmittedProgram = { foo: "bar" };

		await expect(
			usecase.execute({
				taskId: "task-1",
				userId: "user-1",
				submittedProgram: invalidSubmittedProgram,
			}),
		).rejects.toThrow();

		expect(resultRepository.create).not.toHaveBeenCalled();
	});
});
