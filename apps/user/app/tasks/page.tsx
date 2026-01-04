// apps/user/app/tasks/page.tsx
"use client";

import Link from "next/link";
import useSWR from "swr";

type AnyTask = {
  id: string | number;
  title?: string;
  description?: string;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch: ${res.status} ${text}`);
  }
  return res.json();
};

function normalizeTasks(data: unknown): AnyTask[] {
  if (Array.isArray(data)) return data as AnyTask[];
  if (!data || typeof data !== "object") return [];
  const any = data as any;
  const arr = any.tasks ?? any.items ?? any.data ?? [];
  return Array.isArray(arr) ? (arr as AnyTask[]) : [];
}

export default function TasksPage() {
  const { data, error, isLoading } = useSWR("/api/tasks", fetcher);

  const tasks = normalizeTasks(data);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10" data-testid="tasks-page">
      <div className="flex items-baseline justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">課題一覧</h1>
          <p className="text-sm text-muted-foreground">
            1つ選んで、コマンドを組み立てて実行しよう。
          </p>
        </div>

        <Link href="/" className="text-sm text-muted-foreground hover:underline" data-testid="tasks-back-top">
          TOPへ
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">読み込み中…</div>
      ) : error ? (
        <div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
          課題の取得に失敗した。DB起動や seed 状態を確認してね。
        </div>
      ) : tasks.length === 0 ? (
        <div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
          公開済みの課題が見つからない。管理画面 or seed を確認してね。
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {tasks.map((t) => (
            <li key={String(t.id)} className="rounded border bg-background p-4" data-testid="task-card">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold">{t.title ?? `Task ${t.id}`}</div>
                  {t.description ? (
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">{t.description}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">(no description)</p>
                  )}
                </div>

                <Link
                  href={`/tasks/${t.id}`}
                  className="shrink-0 rounded border bg-accent px-3 py-2 text-xs hover:opacity-90"
                  data-testid="task-open"
                >
                  開く
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
