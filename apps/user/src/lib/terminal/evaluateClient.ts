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
   * Playground 用：数列入力（自由入力は禁止。UI側で安全に作る）
   */
  debugInput?: number[];

  /**
   * Playground 用：永続化しない “試運転” を要求する（サーバー側対応時のみ有効）
   */
  dryRun?: boolean;

  /**
   * 実行の意図（サーバー側で分岐したい場合に使う）
   */
  purpose?: "evaluate" | "debug";
}): Promise<EvaluateResponse> {
  const { taskId, userId, submittedProgram, debugInput, dryRun, purpose } =
    params;

  try {
    const body: Record<string, unknown> = { submittedProgram };
    if (userId) body.userId = userId;
    if (debugInput) body.debugInput = debugInput;
    if (typeof dryRun === "boolean") body.dryRun = dryRun;
    if (purpose) body.purpose = purpose;

    const res = await fetch(`/api/tasks/${taskId}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    const parsed = EvaluateResponseSchema.safeParse(data);
    if (parsed.success) return parsed.data;

    const message = !res.ok
      ? `HTTP ${res.status}`
      : "Invalid API response shape";
    return {
      ok: false,
      error: { kind: "UNKNOWN", message, details: data },
    };
  } catch (e) {
    return {
      ok: false,
      error: {
        kind: "NETWORK",
        message: "Network error (failed to reach API)",
        details: String(e),
      },
    };
  }
}
