// apps/admin/app/tasks/new/page.tsx
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState } from "react";

type CreateTaskRequest = {
	title: string;
	description: string;
	dslProgram: unknown;
	testCases: unknown;
	isPublished: boolean;
};

type CreateTaskSuccess = { ok: true; taskId: string };
type CreateTaskFailure = { ok: false; error: string; details?: unknown };
type CreateTaskResponse = CreateTaskSuccess | CreateTaskFailure;

type JsonParseOk = { ok: true; value: unknown };
type JsonParseNg = { ok: false; error: string };
type JsonParseResult = JsonParseOk | JsonParseNg;

const DEFAULT_DSL = {
	version: 1,
	commands: [],
};

const DEFAULT_TEST_CASES = [
	{
		title: "サンプル",
		inputCsv: "a,b\n1,2\n",
		expectedCsv: "a,b\n1,2\n",
	},
];

function isCreateFailure(r: CreateTaskResponse): r is CreateTaskFailure {
	return r.ok === false;
}

function isJsonNg(r: JsonParseResult): r is JsonParseNg {
	return r.ok === false;
}

function safeJsonParse(text: string): JsonParseResult {
	try {
		return { ok: true, value: JSON.parse(text) };
	} catch {
		return { ok: false, error: "JSONの構文が壊れているよ" };
	}
}

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}

function readErrorMessageFromApi(body: unknown): string | null {
	// 期待: { error: string } or { error: { message: string } }
	if (!isRecord(body)) return null;

	const err = body.error;
	if (typeof err === "string") return err;

	if (isRecord(err) && typeof err.message === "string") return err.message;

	return null;
}

function readTaskIdFromApi(body: unknown): string | null {
	// 期待: { taskId: string }（string以外でも来る可能性があるので保守的に扱う）
	if (!isRecord(body)) return null;

	const v = body.taskId;
	if (typeof v === "string") return v;
	if (typeof v === "number") return String(v);

	return null;
}

export default function Page() {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	const [dslProgramText, setDslProgramText] = useState(
		JSON.stringify(DEFAULT_DSL, null, 2),
	);
	const [testCasesText, setTestCasesText] = useState(
		JSON.stringify(DEFAULT_TEST_CASES, null, 2),
	);

	const [isPublished, setIsPublished] = useState(false);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [result, setResult] = useState<CreateTaskResponse | null>(null);

	const parsedDsl = useMemo(
		() => safeJsonParse(dslProgramText),
		[dslProgramText],
	);
	const parsedTests = useMemo(
		() => safeJsonParse(testCasesText),
		[testCasesText],
	);

	const canSubmit =
		title.trim().length > 0 &&
		description.trim().length > 0 &&
		!isJsonNg(parsedDsl) &&
		!isJsonNg(parsedTests) &&
		!isSubmitting;

	async function onSubmit() {
		setIsSubmitting(true);
		setResult(null);

		const dsl = safeJsonParse(dslProgramText);
		const tests = safeJsonParse(testCasesText);

		if (isJsonNg(dsl) || isJsonNg(tests)) {
			setResult({
				ok: false,
				error: "JSONが不正だよ",
				details: {
					dsl: isJsonNg(dsl) ? dsl.error : null,
					testCases: isJsonNg(tests) ? tests.error : null,
				},
			});
			setIsSubmitting(false);
			return;
		}

		const payload: CreateTaskRequest = {
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

			const body: unknown = await res.json().catch(() => null);

			if (!res.ok) {
				const msg =
					readErrorMessageFromApi(body) ??
					`作成に失敗したよ (HTTP ${res.status})`;

				setResult({
					ok: false,
					error: msg,
					details: body,
				});
				return;
			}

			const taskId = readTaskIdFromApi(body) ?? "";
			setResult({ ok: true, taskId });
		} catch (e) {
			const message = e instanceof Error ? e.message : "Unknown error";
			setResult({ ok: false, error: message });
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="mx-auto max-w-3xl p-6 space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>課題作成</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="title">タイトル</Label>
						<Input
							id="title"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="例: sortで昇順にしよう"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">問題文</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="課題の説明をここに"
							rows={5}
						/>
					</div>

					<div className="flex items-center justify-between rounded-md border p-4">
						<div className="space-y-1">
							<div className="font-medium">公開する</div>
							<div className="text-sm text-muted-foreground">
								公開するとユーザー側で一覧に出る想定
							</div>
						</div>
						<Switch checked={isPublished} onCheckedChange={setIsPublished} />
					</div>

					<div className="space-y-2">
						<Label htmlFor="dslProgram">dslProgram（JSON）</Label>
						<Textarea
							id="dslProgram"
							value={dslProgramText}
							onChange={(e) => setDslProgramText(e.target.value)}
							rows={10}
						/>
						{isJsonNg(parsedDsl) ? (
							<p className="text-sm text-red-600">{parsedDsl.error}</p>
						) : null}
					</div>

					<div className="space-y-2">
						<Label htmlFor="testCases">testCases（JSON）</Label>
						<Textarea
							id="testCases"
							value={testCasesText}
							onChange={(e) => setTestCasesText(e.target.value)}
							rows={10}
						/>
						{isJsonNg(parsedTests) ? (
							<p className="text-sm text-red-600">{parsedTests.error}</p>
						) : null}
					</div>

					<div className="flex gap-3">
						<Button onClick={onSubmit} disabled={!canSubmit}>
							{isSubmitting ? "送信中…" : "作成"}
						</Button>
					</div>

					{result ? (
						result.ok ? (
							<Alert>
								<AlertTitle>作成できたよ</AlertTitle>
								<AlertDescription>taskId: {result.taskId}</AlertDescription>
							</Alert>
						) : (
							<Alert>
								<AlertTitle>失敗したよ</AlertTitle>
								<AlertDescription>
									<div className="space-y-2">
										<div>
											{isCreateFailure(result) ? result.error : "Unknown error"}
										</div>
										{isCreateFailure(result) && result.details ? (
											<pre className="overflow-auto rounded bg-muted p-3 text-xs">
												{JSON.stringify(result.details, null, 2)}
											</pre>
										) : null}
									</div>
								</AlertDescription>
							</Alert>
						)
					) : null}
				</CardContent>
			</Card>
		</main>
	);
}
