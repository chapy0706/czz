// apps/user/src/usecases/createTask.ts

import type { Task } from "@czz/domain/entities/task";
import type { UserId } from "@czz/domain/entities/user";
import type { TaskRepository } from "@czz/domain/repositories/taskRepository";

/**
 * 管理画面からタスクを作成するための入力 DTO
 * （HTTP リクエストと Domain の橋渡し用）
 */
export interface CreateTaskCommand {
  title: string;
  description: string;
  isPublished: boolean;
  dslProgram: unknown;
  testCases: unknown;
  /**
   * 本来は認証情報から取得するが、
   * まだ認証未導入のため一旦オプション扱い
   */
  createdByUserId?: UserId;
}

/**
 * タスク作成ユースケース
 *
 * - Presentation(API) はこのユースケースに依存
 * - ユースケースは TaskRepository 抽象に依存
 * - Infra(Drizzle) は TaskRepository を実装
 */
export class CreateTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(command: CreateTaskCommand): Promise<Task> {
    const {
      title,
      description,
      isPublished,
      dslProgram,
      testCases,
      createdByUserId,
    } = command;

    // 認証導入前の暫定: 作成者 ID が無いときはダミー ID を使う
    // TODO: Supabase Auth 導入後に、セッションの user.id を必須にする
    const effectiveUserId: UserId =
      createdByUserId ?? "00000000-0000-0000-0000-000000000000";

    const newTask = await this.taskRepository.create({
      title,
      description,
      isPublished,
      dslProgram,
      testCases,
      createdByUserId: effectiveUserId,
    });

    return newTask;
  }
}
