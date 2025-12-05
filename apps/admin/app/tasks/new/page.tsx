// apps/admin/app/tasks/new/page.tsx
"use client";

import { FormEvent, useState } from "react";

type CreateTaskFormState = {
  title: string;
  description: string;
  isPublished: boolean;
  dslProgramJson: string;
  testCasesJson: string;
};

export default function NewTaskPage() {
  const [form, setForm] = useState<CreateTaskFormState>({
    title: "",
    description: "",
    isPublished: false,
    dslProgramJson: "{\n  \n}",
    testCasesJson: "[\n  \n]",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof CreateTaskFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === "isPublished"
          ? (event as React.ChangeEvent<HTMLInputElement>).target.checked
          : event.target.value;

      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      let dslProgram: unknown;
      let testCases: unknown;

      try {
        dslProgram = JSON.parse(form.dslProgramJson);
      } catch {
        setError("DSL Program の JSON が不正です。");
        setSubmitting(false);
        return;
      }

      try {
        testCases = JSON.parse(form.testCasesJson);
      } catch {
        setError("Test Cases の JSON が不正です。");
        setSubmitting(false);
        return;
      }

      const API_BASE =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3100";

      const response = await fetch(`${API_BASE}/api/admin/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          isPublished: form.isPublished,
          dslProgram,
          testCases,
          // createdByUserId は未指定 → UseCase 側でダミー ID が入る
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        console.error("API error:", body);
        setError("タスクの作成に失敗しました。");
        return;
      }

      const body = await response.json();
      setMessage(`タスクを作成しました: ${body.task.title} (${body.task.id})`);

      // 必要ならフォームをリセット
      // setForm({
      //   title: "",
      //   description: "",
      //   isPublished: false,
      //   dslProgramJson: "{\n  \n}",
      //   testCasesJson: "[\n  \n]",
      // });
    } catch (err) {
      console.error(err);
      setError("予期せぬエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">タスク作成</h1>

      {message && (
        <p className="rounded border border-green-500 bg-green-50 px-3 py-2 text-sm">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded border border-red-500 bg-red-50 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">
            タイトル
            <input
              type="text"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={form.title}
              onChange={handleChange("title")}
              required
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium">
            説明
            <textarea
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              rows={4}
              value={form.description}
              onChange={handleChange("description")}
              required
            />
          </label>
        </div>

        <div>
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={handleChange("isPublished")}
            />
            公開する
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium">
            DSL Program (JSON)
            <textarea
              className="mt-1 w-full rounded border px-2 py-1 font-mono text-xs"
              rows={6}
              value={form.dslProgramJson}
              onChange={handleChange("dslProgramJson")}
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Test Cases (JSON)
            <textarea
              className="mt-1 w-full rounded border px-2 py-1 font-mono text-xs"
              rows={6}
              value={form.testCasesJson}
              onChange={handleChange("testCasesJson")}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "作成中..." : "作成する"}
        </button>
      </form>
    </main>
  );
}
