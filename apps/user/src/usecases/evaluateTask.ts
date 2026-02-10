// apps/user/src/usecases/evaluateTask.ts
import type { ResultRepository } from "@czz/domain/repositories/resultRepository";
import type { TaskRepository } from "@czz/domain/repositories/taskRepository";
import {
	dslProgramSchema,
	dslTestCaseSchema,
	runTestCases,
} from "@czz/dsl-core";

type EvaluateTaskDeps = {
	taskRepository: TaskRepository;
	resultRepository: ResultRepository;
};

type ExecuteParams = {
	taskId: string;
	userId?: string; // ゲスト実行では未指定
	submittedProgram: unknown; // API/フォームから来るJSON
};

export class EvaluateTaskUseCase {
	constructor(private readonly deps: EvaluateTaskDeps) {}

	async execute(params: ExecuteParams) {
		const { taskId, userId, submittedProgram: rawSubmitted } = params;

		const task = await this.deps.taskRepository.findById(taskId);
		if (!task) throw new Error("Task not found");

		// DB 上は JSONB（unknown）なので UseCase で検証
		const testCases = dslTestCaseSchema.array().parse(task.testCases);

		// ユーザーが提出した DSL を検証して実行
		const submittedProgram = dslProgramSchema.parse(rawSubmitted);
		const result = runTestCases(submittedProgram, testCases);

		// userId がある場合のみ保存を試みる（ゲストは保存しない）
		// userId が DB に存在しない場合の FK 違反は “保存しない扱い” に落とす
		let resultId: string | undefined;
		if (userId) {
			try {
				const saved = await this.deps.resultRepository.create({
					taskId,
					userId,
					submittedProgram,
					resultStatus: result.allPassed, // boolean（0/1変換はrepoで）
				});
				resultId = saved.id;
			} catch (e) {
				if (!isForeignKeyViolation(e)) throw e;
				// 保存だけ失敗：評価結果は返す（ゲスト相当として扱う）
			}
		}

		return resultId ? { ...result, resultId } : result;
	}
}

function isForeignKeyViolation(e: unknown): boolean {
	// Postgres: foreign_key_violation = 23503
	if (!e || typeof e !== "object") return false;
	const anyErr = e as { code?: unknown; message?: unknown };
	if (anyErr.code === "23503") return true;
	if (
		typeof anyErr.message === "string" &&
		anyErr.message.includes("violates foreign key constraint")
	)
		return true;
	return false;
}
