// packages/domain/src/entities/result.ts
export interface Result {
  id: string;
  taskId: string;
  userId: string;
  resultStatus: 0 | 1;
  output: string;
  createdAt: Date;
  updatedAt: Date;
}
