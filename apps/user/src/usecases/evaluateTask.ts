// apps/user/src/usecases/evaluateTask.ts
import type { ResultRepository } from "@czz/domain/repositories/resultRepository";
import type { TaskRepository } from "@czz/domain/repositories/taskRepository";
import { dslProgramSchema, dslTestCaseSchema, runTestCases } from "@czz/dsl-core";

type EvaluateTaskDeps = {
  taskRepository: TaskRepository;
  resultRepository: ResultRepository;
};

type ExecuteParams = {
  taskId: string;
  userId: string;
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

    // DB schema（submittedProgram / resultStatus）に合わせて保存
    await this.deps.resultRepository.create({
      taskId,
      userId,
      submittedProgram,
      resultStatus: result.allPassed, // boolean（0/1変換はrepoで）
    });

    return result;
  }
}
