// packages/domain/src/repositories/taskRepository.ts

import type { NewTask, Task, TaskId } from "../entities/task";

export interface TaskRepository {
  findPublished(): Promise<Task[]>;
  findById(id: TaskId): Promise<Task | null>;
  create(input: NewTask): Promise<Task>;
  // 必要になったら update/delete を追加
}
