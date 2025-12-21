// apps/user/src/lib/terminal/evaluateClient.ts

export type EvaluateErrorKind = "ZOD" | "TEST" | "NETWORK" | "UNKNOWN";

export type EvaluateError = {
  kind: EvaluateErrorKind;
  message: string;
  details?: unknown;
};

export type EvaluateResponseOk = {
  ok: true;
  passed: number;
  total: number;
  output?: unknown;
};

export type EvaluateResponseErr = {
  ok: false;
  passed?: number;
  total?: number;
  error: EvaluateError;
};

export type EvaluateResponse = EvaluateResponseOk | EvaluateResponseErr;

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

    if (!res.ok) {
      // 失敗レスポンスは実装によって形が揺れやすいので、できるだけ拾う
      const message =
        (data?.error as string | undefined) ??
        (data?.error?.message as string | undefined) ??
        (data?.message as string | undefined) ??
        `HTTP ${res.status}`;

      return {
        ok: false,
        error: { kind: "UNKNOWN", message, details: data },
      };
    }

    // 成功レスポンスの形式も揺れやすいので “あるものを使う”
    // - { ok: true, passed, total, output }
    // - { ok: true, result }
    // の両対応を狙う
    const passedRaw = data?.passed ?? data?.passCount;
    const totalRaw = data?.total ?? data?.totalCount;
    const passed =
      typeof passedRaw === "number"
        ? passedRaw
        : passedRaw != null
          ? Number(passedRaw)
          : 1;
    const total =
      typeof totalRaw === "number"
        ? totalRaw
        : totalRaw != null
          ? Number(totalRaw)
          : 1;

    const output =
      (data?.output as unknown | undefined) ??
      (data?.result as unknown | undefined);

    return {
      ok: true,
      passed,
      total,
      output,
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
