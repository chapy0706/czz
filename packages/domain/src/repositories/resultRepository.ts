// packages/domain/src/repositories/resultRepository.ts
import type { NewResult, Result, ResultId } from "../entities/result";

export interface CreateResultParams {
  taskId: string;
  userId: string;
  resultStatus: 0 | 1;
  output: string;
}

export interface ResultRepository {
  create(input: NewResult): Promise<Result>;
  findById(id: ResultId): Promise<Result | null>; // いま要らなければ後回しでもOK
}
