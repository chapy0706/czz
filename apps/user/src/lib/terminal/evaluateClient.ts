// apps/user/src/lib/terminal/evaluateClient.ts

import { EvaluateResponseSchema, type EvaluateResponse } from "@/lib/terminal/evaluateContract";

export async function evaluateTask(params: {
  taskId: string;
  userId: string;
  submittedProgram: unknown;
}): Promise<EvaluateResponse> {
  const { taskId, userId, submittedProgram } = params;

  try {
    const res = await fetch(`/api/tasks/${taskId}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, submittedProgram }),
    });

    const data = await res.json().catch(() => null);

    // HTTPエラーでも、契約型に合わせて返す（API側が整っていればここでOKになる）
    const parsed = EvaluateResponseSchema.safeParse(data);
    if (parsed.success) return parsed.data;

    const message = !res.ok ? `HTTP ${res.status}` : "Invalid API response shape";
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
