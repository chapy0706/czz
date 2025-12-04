// apps/user/src/usecases/listPublishedTasks.ts

import type { Task } from "@czz/domain/entities/task";
import type { TaskRepository } from "@czz/domain/repositories/taskRepository";

/**
 * 公開済みタスク一覧を取得するユースケース
 *
 * - Presentation(API / UI) からは TaskRepository 抽象にだけ依存する
 * - ここにビジネスルール（例えばソート順やフィルタ）を集約していく
 */
export class ListPublishedTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(): Promise<Task[]> {
    // 現時点では Repository(findPublished) に丸投げ
    const tasks = await this.taskRepository.findPublished();

    // 将来、「公開日時の降順にソートしたい」などが出てきたらここで行う
    // return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return tasks;
  }
}
