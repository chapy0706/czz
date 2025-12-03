// packages/domain/src/entities/task.ts
import type { UserId } from "./user";

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
  // DB に挿入時に必須なもの
  dslProgram: unknown;    // TODO: DSL の型が固まったら専用型にする
  testCases: unknown;     // TODO: TestCase 型にする
  createdByUserId: UserId;
}
