// apps/admin/app/tasks/new/page.tsx
"use client";

import * as React from "react";

type TaskForm = {
  title: string;
  description: string;
  dslProgramJson: string;
  testCasesJson: string;
  isPublished: boolean;
};

function safeJsonParse(
  raw: string,
): { ok: true; value: unknown } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON";
    return { ok: false, message: msg };
  }
}

function Checkbox(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      {props.label}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-md border px-3 py-2 text-sm",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-md border px-3 py-2 font-mono text-xs",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

export default function AdminNewTaskPage() {
  const [form, setForm] = React.useState<TaskForm>({
    title: "",
    description: "",
    dslProgramJson: '{\n  "commands": []\n}',
    testCasesJson:
      '[\n  {\n    "input": {},\n    "expected": {}\n  },\n  {\n    "input": {},\n    "expected": {}\n  },\n  {\n    "input": {},\n    "expected": {}\n  }\n]',
    isPublished: false,
  });

  const [status, setStatus] = React.useState<string>("");

  const handleChange =
    (key: keyof TaskForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    const dslParsed = safeJsonParse(form.dslProgramJson);
    if (!dslParsed.ok) {
      setStatus(`dslProgram JSON error: ${dslParsed.message}`);
      return;
    }

    const tcParsed = safeJsonParse(form.testCasesJson);
    if (!tcParsed.ok) {
      setStatus(`testCases JSON error: ${tcParsed.message}`);
      return;
    }

    const payload = {
      title: form.title,
      description: form.description,
      dslProgram: dslParsed.value,
      testCases: tcParsed.value,
      isPublished: form.isPublished ? 1 : 0,
    };

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      setStatus(`POST /api/tasks error: ${res.status} ${text}`);
      return;
    }

    setStatus("OK: created");
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">New Task</h1>

      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <div className="text-sm font-medium">Title</div>
          <Input
            value={form.title}
            onChange={handleChange("title")}
            placeholder="例: A-1 はじめてのフィルター"
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Description</div>
          <Input
            value={form.description}
            onChange={handleChange("description")}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">dslProgram (JSON)</div>
          <Textarea
            rows={10}
            value={form.dslProgramJson}
            onChange={handleChange("dslProgramJson")}
          />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">testCases (JSON)</div>
          <Textarea
            rows={12}
            value={form.testCasesJson}
            onChange={handleChange("testCasesJson")}
          />
          <div className="text-xs text-muted-foreground">
            最低3本を初期で用意。ここから 5 本まで増やしてもOK。
          </div>
        </div>

        <Checkbox
          checked={form.isPublished}
          onChange={(checked) =>
            setForm((prev) => ({ ...prev, isPublished: checked }))
          }
          label="Published"
        />

        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
          >
            Create
          </button>
          {status ? (
            <div className="text-sm text-muted-foreground">{status}</div>
          ) : null}
        </div>
      </form>
    </main>
  );
}
