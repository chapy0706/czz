// apps/user/src/lib/terminal/evaluateClient.ts

import {
  EvaluateResponseSchema,
  type EvaluateResponse,
} from "@/lib/terminal/evaluateContract";

export async function evaluateTask(params: {
  taskId: string;
  userId?: string;
  submittedProgram: unknown;

  /**
   * Playground 用：安全に組み立てた数列入力
   */
  debugInput?: number[];

  /**
   * Playground 用：永続化しない試運転（サーバーが対応していれば）
   */
  dryRun?: boolean;

  /**
   * Playground 用：サーバー側で簡易実行に切り替えるスイッチ
   */
  purpose?: "evaluate" | "debug";
}): Promise<EvaluateResponse> {
  try {
    const res = await fetch(`/api/tasks/${params.taskId}/evaluate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId: params.userId,
        submittedProgram: params.submittedProgram,
        debugInput: params.debugInput,
        dryRun: params.dryRun,
        purpose: params.purpose,
      }),
    });

    const json = await res.json();
    const parsed = EvaluateResponseSchema.parse(json);
    return parsed;
  } catch (e) {
    const response: EvaluateResponse = {
      ok: false,
      error: {
        kind: "NETWORK",
        message: "Network error",
        details: e,
      },
    };
    return response;
  }
}
