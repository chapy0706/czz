// apps/user/src/usecases/evaluateTask.ts
import type { ResultRepository } from "@czz/domain/repositories/resultRepository";
import type { TaskRepository } from "@czz/domain/repositories/taskRepository";
import { dslProgramSchema, dslTestCaseSchema, runTestCases } from "@czz/dsl-core";

type EvaluateTaskDeps = {
  taskRepository: TaskRepository;
  resultRepository: ResultRepository;
};

export class EvaluateTaskUseCase {
  constructor(private readonly deps: EvaluateTaskDeps) {}

  async execute(params: { taskId: string; userId: string }) {
    const { taskId, userId } = params;

    const task = await this.deps.taskRepository.findById(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    // DB 上は JSONB として保存されている想定
    const program = dslProgramSchema.parse(task.dslProgram);
    const testCases = dslTestCaseSchema.array().parse(task.testCases);

    const result = runTestCases(program, testCases);

    // 結果の保存用ペイロード（output は JSON 文字列でいい）
    await this.deps.resultRepository.create({
      taskId,
      userId,
      resultStatus: result.allPassed ? 1 : 0,
      output: JSON.stringify(result),
    });

    return result;
  }
}
