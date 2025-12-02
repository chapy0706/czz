// packages/domain/src/entities/task.ts

export type TaskId = string;

export interface Task {
  id: TaskId;
  title: string;
  description: string;
  // 公開フラグ（DBでは 0/1 だが Domain では boolean で扱う）
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  // 必要なら createdBy, updatedBy などを追加
}

export interface NewTask {
  title: string;
  description: string;
  isPublished: boolean;
}
