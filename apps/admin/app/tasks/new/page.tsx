// apps/admin/app/tasks/new/page.tsx
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import * as React from "react";

type JsonRecord = Record<string, unknown>;

function asRecord(v: unknown): JsonRecord | null {
	return !!v && typeof v === "object" && !Array.isArray(v) ? (v as JsonRecord) : null;
}

type EditorState = {
	value: string;
	setValue: (v: string) => void;
	reset: () => void;
};

function useEditor(initial: string): EditorState {
	const [value, setValue] = React.useState(initial);
	return {
		value,
		setValue,
		reset: () => setValue(initial),
	};
}

type ResultState =
	| { ok: true; taskId: string }
	| { ok: false; error: string; details?: unknown }
	| null;

export default function Page() {
	const [title, setTitle] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [isPublished, setIsPublished] = React.useState(false);

	const dsl = useEditor(
		JSON.stringify(
			{
				commands: [{ type: "SORT_ASC" }],
			},
			null,
			2,
		),
	);

	const tests = useEditor(
		JSON.stringify(
			[
				{
					title: "example",
					input: [3, 1, 2],
					expected: [1, 2, 3],
				},
			],
			null,
			2,
		),
	);

	const [result, setResult] = React.useState<ResultState>(null);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);
		setResult(null);

		const payload = {
			title: title.trim(),
			description: description.trim(),
			dslProgram: dsl.value,
			testCases: tests.value,
			isPublished,
		};

		try {
			const res = await fetch("/api/admin/tasks", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data: unknown = await res.json().catch(() => null);
			const rec = asRecord(data);

			if (!res.ok) {
				const err =
					rec && typeof rec.error === "string"
						? rec.error
						: `作成に失敗したよ (HTTP ${res.status})`;
				setResult({
					ok: false,
					error: err,
					details: data,
				});
				return;
			}

			const rawTaskId = rec?.taskId;
			const taskId = typeof rawTaskId === "string" ? rawTaskId : String(rawTaskId ?? "");
			setResult({ ok: true, taskId });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error";
			setResult({ ok: false, error: message });
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="mx-auto max-w-3xl space-y-6 p-6">
			<Card>
				<CardHeader>
					<CardTitle>タスク作成</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-6" onSubmit={onSubmit}>
						<div className="space-y-2">
							<Label htmlFor="title">タイトル</Label>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="例: 並び替えの練習"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="desc">説明</Label>
							<Textarea
								id="desc"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="この課題で何を学べる？"
							/>
						</div>

						<div className="flex items-center gap-3">
							<Switch
								checked={isPublished}
								onCheckedChange={(v) => setIsPublished(Boolean(v))}
								aria-label={isPublished ? "公開をオフにする" : "公開をオンにする"}
							/>
							<div className="text-sm">公開</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="dsl">dslProgram (JSON)</Label>
							<Textarea
								id="dsl"
								value={dsl.value}
								onChange={(e) => dsl.setValue(e.target.value)}
								className="font-mono text-xs"
								rows={10}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="tests">testCases (JSON)</Label>
							<Textarea
								id="tests"
								value={tests.value}
								onChange={(e) => tests.setValue(e.target.value)}
								className="font-mono text-xs"
								rows={10}
							/>
						</div>

						<div className="flex items-center gap-3">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "作成中..." : "作成"}
							</Button>
							<Button
								type="button"
								variant="secondary"
								onClick={() => {
									setTitle("");
									setDescription("");
									setIsPublished(false);
									dsl.reset();
									tests.reset();
									setResult(null);
								}}
							>
								リセット
							</Button>
						</div>

						{result?.ok === true ? (
							<Alert>
								<AlertTitle>作成できたよ</AlertTitle>
								<AlertDescription>taskId: {result.taskId}</AlertDescription>
							</Alert>
						) : null}

						{result?.ok === false ? (
							<Alert variant="destructive">
								<AlertTitle>失敗</AlertTitle>
								<AlertDescription>{result.error}</AlertDescription>
							</Alert>
						) : null}
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
