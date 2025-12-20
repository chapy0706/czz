// apps/user/app/tasks/[taskId]/page.tsx
"use client";

import { useMemo, useState } from "react";

type ApiOk = { ok: true; result: unknown };
type ApiNg = { ok: false; error: string; details?: unknown };
type ApiResponse = ApiOk | ApiNg;

type JsonParseResult = {
  ok: boolean;
  value: unknown | null;
  error: string | null;
};

function safeJsonParse(text: string): JsonParseResult {
  try {
    return { ok: true, value: JSON.parse(text), error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON";
    return { ok: false, value: null, error: msg };
  }
}

export default function TaskDetailPage({ params }: { params: { taskId: string } }) {
  const taskId = params.taskId;

  const [userId, setUserId] = useState("");
  const [submittedProgramJson, setSubmittedProgramJson] = useState(
    JSON.stringify({ commands: [] }, null, 2),
  );

  const [isRunning, setIsRunning] = useState(false);
  const [resStatus, setResStatus] = useState<number | null>(null);
  const [apiRes, setApiRes] = useState<ApiResponse | null>(null);

  const parsedSubmitted = useMemo(
    () => safeJsonParse(submittedProgramJson),
    [submittedProgramJson],
  );

  const run = async () => {
    if (!userId) return;

    setIsRunning(true);
    setApiRes(null);
    setResStatus(null);

    try {
      const body: Record<string, unknown> = {
        userId,
        submittedProgram: parsedSubmitted.value, // JSON壊れてたら null
      };

      const res = await fetch(`/api/tasks/${taskId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setResStatus(res.status);
      const data = (await res.json()) as ApiResponse;
      setApiRes(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setApiRes({ ok: false, error: msg });
    } finally {
      setIsRunning(false);
    }
  };

  const canRun = userId.length > 0 && parsedSubmitted.error === null;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">Task Detail</h1>
        <p className="text-sm text-muted-foreground break-all">taskId: {taskId}</p>
      </header>

      <section className="space-y-2">
        <label className="block text-sm font-medium">userId (UUID)</label>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="e.g. e5ca5f62-1926-4dfc-8c67-161e334b7ade"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </section>

      <section className="space-y-2">
        <div className="flex items-end justify-between gap-3">
          <label className="block text-sm font-medium">submittedProgram (JSON)</label>
          <div className="flex gap-2">
            <button
              className="rounded border px-3 py-1 text-xs"
              type="button"
              onClick={() => setSubmittedProgramJson(JSON.stringify({ commands: [] }, null, 2))}
            >
              テンプレ: commands=[]
            </button>
          </div>
        </div>

        <textarea
          className="min-h-[200px] w-full rounded border px-3 py-2 font-mono text-xs"
          value={submittedProgramJson}
          onChange={(e) => setSubmittedProgramJson(e.target.value)}
        />

        {parsedSubmitted.error !== null && (
          <p className="text-sm text-red-500">JSON が壊れてる: {parsedSubmitted.error}</p>
        )}
      </section>

      <section className="flex items-center gap-3">
        <button
          className="rounded border px-4 py-2 text-sm disabled:opacity-50"
          type="button"
          disabled={!canRun || isRunning}
          onClick={run}
        >
          {isRunning ? "Running..." : "実行"}
        </button>

        {resStatus !== null && (
          <span className="text-sm text-muted-foreground">HTTP {resStatus}</span>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Result</h2>
        <pre className="overflow-auto rounded border p-3 text-xs">
          {apiRes ? JSON.stringify(apiRes, null, 2) : "(no result)"}
        </pre>
      </section>
    </main>
  );
}
