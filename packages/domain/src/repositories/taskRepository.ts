// packages/domain/src/repositories/taskRepository.ts

import type { NewTask, Task, TaskId, UpdateTask } from "../entities/task";

export interface TaskRepository {
	findPublished(): Promise<Task[]>;
	findAll(): Promise<Task[]>;
	findById(id: TaskId): Promise<Task | null>;
	create(input: NewTask): Promise<Task>;
	update(id: TaskId, input: UpdateTask): Promise<Task | null>;
	delete(id: TaskId): Promise<boolean>;
}
