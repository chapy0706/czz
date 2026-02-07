import type { TaskId } from "./task";
import type { UserId } from "./user";

export type ResultId = string;

export interface Result {
	id: ResultId;
	taskId: TaskId;
	userId: UserId;
	submittedProgram: unknown;
	resultStatus: boolean;
	createdAt: Date;
}

export interface NewResult {
	taskId: TaskId;
	userId: UserId;
	submittedProgram: unknown;
	resultStatus: boolean;
}
