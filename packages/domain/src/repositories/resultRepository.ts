// packages/domain/src/repositories/resultRepository.ts
import type { Result } from "../entities/result";

export interface CreateResultParams {
  taskId: string;
  userId: string;
  resultStatus: 0 | 1;
  output: string;
}

export interface ResultRepository {
  create(params: CreateResultParams): Promise<Result>;
  // 将来の拡張用に findById/findByTaskId とか追加してもOK
}
