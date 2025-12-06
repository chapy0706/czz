// apps/admin/app/tasks/new/page.tsx
"use client";

import { FormEvent, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type CreateTaskFormState = {
  title: string;
  description: string;
  isPublished: boolean;
  dslProgramJson: string;
  testCasesJson: string;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3100";

export default function NewTaskPage() {
  const [form, setForm] = useState<CreateTaskFormState>({
    title: "",
    description: "",
    isPublished: false,
    dslProgramJson: '{\n  "version": 1,\n  "commands": []\n}',
    testCasesJson: '[\n  {\n    "input": {},\n    "expected": {}\n  }\n]',
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [dslJsonError, setDslJsonError] = useState<string | null>(null);
  const [testCasesJsonError, setTestCasesJsonError] = useState<string | null>(null);

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

      // JSON フィールド変更時はエラーをクリア
      if (field === "dslProgramJson") setDslJsonError(null);
      if (field === "testCasesJson") setTestCasesJsonError(null);
    };

  const formatDslJson = () => {
    try {
      const parsed = JSON.parse(form.dslProgramJson);
      const pretty = JSON.stringify(parsed, null, 2);
      setForm((prev) => ({ ...prev, dslProgramJson: pretty }));
      setDslJsonError(null);
    } catch {
      setDslJsonError("DSL Program の JSON が不正です。");
    }
  };

  const formatTestCasesJson = () => {
    try {
      const parsed = JSON.parse(form.testCasesJson);
      const pretty = JSON.stringify(parsed, null, 2);
      setForm((prev) => ({ ...prev, testCasesJson: pretty }));
      setTestCasesJsonError(null);
    } catch {
      setTestCasesJsonError("Test Cases の JSON が不正です。");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);
    setDslJsonError(null);
    setTestCasesJsonError(null);

    try {
      let dslProgram: unknown;
      let testCases: unknown;

      try {
        dslProgram = JSON.parse(form.dslProgramJson);
      } catch {
        setDslJsonError("DSL Program の JSON が不正です。");
        setSubmitting(false);
        return;
      }

      try {
        testCases = JSON.parse(form.testCasesJson);
      } catch {
        setTestCasesJsonError("Test Cases の JSON が不正です。");
        setSubmitting(false);
        return;
      }

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
      //   dslProgramJson: '{\n  "version": 1,\n  "commands": []\n}',
      //   testCasesJson: '[\n  {\n    "input": {},\n    "expected": {}\n  }\n]',
      // });
    } catch (err) {
      console.error(err);
      setError("予期せぬエラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">タスク作成</h1>

      {message && (
        <Alert className="border-green-500">
          <AlertTitle>成功</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="title">タイトル</Label>
            <Input
              id="title"
              value={form.title}
              onChange={handleChange("title")}
              placeholder="例: 配列を昇順に並び替えよう"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">説明</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={handleChange("description")}
              rows={4}
              placeholder="この課題のゴールや前提条件を記述します。"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isPublished">公開する</Label>
              <p className="text-xs text-muted-foreground">
                チェックを入れると、ユーザー側の一覧に表示されます。
              </p>
            </div>
            <Switch
              id="isPublished"
              checked={form.isPublished}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, isPublished: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>DSL Program (JSON)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={form.dslProgramJson}
            onChange={handleChange("dslProgramJson")}
            rows={10}
            className="font-mono text-xs"
            spellCheck={false}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={formatDslJson}
            >
              JSON を整形
            </Button>
          </div>
          {dslJsonError && (
            <p className="text-xs text-red-600">{dslJsonError}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Cases (JSON)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={form.testCasesJson}
            onChange={handleChange("testCasesJson")}
            rows={10}
            className="font-mono text-xs"
            spellCheck={false}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={formatTestCasesJson}
            >
              JSON を整形
            </Button>
          </div>
          {testCasesJsonError && (
            <p className="text-xs text-red-600">{testCasesJsonError}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardFooter className="justify-end">
          <Button type="submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "作成中..." : "作成する"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
