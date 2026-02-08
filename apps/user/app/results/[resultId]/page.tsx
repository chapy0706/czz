// apps/user/app/results/[resultId]/page.tsx
"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { SfxLink as Link } from "@/components/ui/SfxLink";
import { useTerminalResultCacheStore } from "@/lib/terminal/terminalStore";

type TaskTestCase = {
	title?: string;
};

type CaseVerdict = {
	index: string;
	title: string;
	ok: boolean;
	detail?: string;
};

type EvaluateOk = {
	ok: true;
	output?: unknown;
	passed?: number;
	total?: number;
	// 互換: results / testResults / caseResults など “揺れ” を吸収
	results?: unknown[];
	testResults?: unknown[];
	caseResults?: unknown[];
	details?: {
		results?: unknown[];
		testResults?: unknown[];
		caseResults?: unknown[];
		cases?: unknown[];
	};
};

type EvaluateErr = {
	ok: false;
	error?: {
		kind?: string;
		message?: string;
	};
};

type EvaluateResponse = EvaluateOk | EvaluateErr;

function extractText(x: unknown): string {
	if (x == null) return "";
	if (typeof x === "string") return x;
	if (typeof x === "number" || typeof x === "boolean" || typeof x === "bigint")
		return String(x);
	try {
		return JSON.stringify(x, null, 2);
	} catch {
		return String(x);
	}
}

function formatHumanReadable(value: unknown): string {
	if (value == null) return "";
	if (typeof value === "string") return value;
	if (
		typeof value === "number" ||
		typeof value === "boolean" ||
		typeof value === "bigint"
	) {
		return String(value);
	}
	if (Array.isArray(value)) {
		// 配列は 1 行ずつ見せたいことが多い
		return value.map((v) => formatHumanReadable(v)).join("\n");
	}
	try {
		const obj = value as Record<string, unknown>;
		// { value: [...] } のような包みを軽く救う
		if ("value" in obj) return formatHumanReadable(obj.value);
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

async function fetchTaskTestTitles(taskId: string): Promise<string[]> {
	try {
		const res = await fetch(`/api/tasks/${taskId}`, { cache: "no-store" });
		if (!res.ok) return [];
		const json = (await res.json()) as unknown;
		if (!json || typeof json !== "object") return [];

		const obj = json as Record<string, unknown>;
		if (obj.ok !== true) return [];

		const value =
			(obj.value as unknown) ??
			(obj.task as unknown) ??
			((obj.value && typeof obj.value === "object"
				? (obj.value as Record<string, unknown>).task
				: undefined) as unknown) ??
			(obj.value as unknown);

		if (!value || typeof value !== "object") return [];
		const v = value as Record<string, unknown>;

		const testCases = (v.testCases ?? v.testcases ?? v.cases) as unknown;
		if (!Array.isArray(testCases)) return [];

		return testCases
			.map((c: unknown) => {
				if (!c || typeof c !== "object") return null;
				const t = (c as TaskTestCase).title;
				return typeof t === "string" ? t : null;
			})
			.filter((x): x is string => typeof x === "string" && x.length > 0);
	} catch {
		return [];
	}
}

function isCaseOk(c: unknown): boolean {
	if (!c) return false;
	if (typeof c === "object") {
		const o = c as Record<string, unknown>;
		if (typeof o.ok === "boolean") return o.ok;
		if (typeof o.passed === "boolean") return o.passed;
		if (typeof o.success === "boolean") return o.success;
		if (typeof o.status === "string") return o.status.toLowerCase() === "pass";
	}
	return false;
}

function pickCaseTitle(
	c: unknown,
	index: number,
	overrideTitles?: string[],
): string {
	if (overrideTitles?.[index]) return overrideTitles[index];

	if (!c || typeof c !== "object") return `ケース ${index + 1}`;
	const obj = c as Record<string, unknown>;
	for (const key of ["title", "name", "label"]) {
		const v = obj[key];
		if (typeof v === "string" && v.length > 0) return v;
	}
	return `ケース ${index + 1}`;
}

function pickCaseDetail(c: unknown): string | undefined {
	const parts: string[] = [];
	if (c && typeof c === "object") {
		const obj = c as Record<string, unknown>;
		if (typeof obj.message === "string" && obj.message) parts.push(obj.message);
		if (typeof obj.expected === "string" && obj.expected)
			parts.push(`expected: ${obj.expected}`);
		if (typeof obj.actual === "string" && obj.actual)
			parts.push(`actual: ${obj.actual}`);
		if (typeof obj.diff === "string" && obj.diff) parts.push(obj.diff);
	}
	return parts.length > 0 ? parts.join("\n") : undefined;
}

function toResultPanelProps(
	res: EvaluateResponse,
	testTitles?: string[],
): {
	total: number;
	passed: number;
	cases: CaseVerdict[];
	isAllPassed: boolean;
} {
	const passedFromTop =
		typeof (res as EvaluateOk).passed === "number"
			? (res as EvaluateOk).passed!
			: 0;
	const totalFromTop =
		typeof (res as EvaluateOk).total === "number"
			? (res as EvaluateOk).total!
			: 0;

	const candidates: unknown[] = [
		(res as EvaluateOk).caseResults,
		(res as EvaluateOk).testResults,
		(res as EvaluateOk).results,
		(res as EvaluateOk).details?.caseResults,
		(res as EvaluateOk).details?.testResults,
		(res as EvaluateOk).details?.results,
		(res as EvaluateOk).details?.cases,
	];

	const arr = candidates.find((x) => Array.isArray(x)) as unknown[] | undefined;

	const cases: CaseVerdict[] = Array.isArray(arr)
		? arr.map((c, i) => ({
				index: `${i}`,
				title: pickCaseTitle(c, i, testTitles),
				ok: isCaseOk(c),
				detail: pickCaseDetail(c),
			}))
		: [];

	const total = totalFromTop > 0 ? totalFromTop : cases.length;
	const passed =
		passedFromTop > 0 ? passedFromTop : cases.filter((c) => c.ok).length;
	const isAllPassed = total > 0 ? passed === total : res.ok;

	return { total, passed, cases, isAllPassed };
}

export default function ResultDetailPage(props: {
	params: { resultId: string };
}) {
	const router = useRouter();
	const { resultId } = props.params;

	const cache = useTerminalResultCacheStore((s) => s.cache);
	const item = cache[resultId];

	const [testTitles, setTestTitles] = React.useState<string[] | null>(null);

	React.useEffect(() => {
		const taskId = item?.taskId;
		if (!taskId) return;

		let cancelled = false;
		fetchTaskTestTitles(taskId).then((titles) => {
			if (cancelled) return;
			setTestTitles(titles);
		});
		return () => {
			cancelled = true;
		};
	}, [item?.taskId]);

	if (!item) {
		return (
			<div className="mx-auto w-full max-w-3xl px-4 py-10">
				<div className="rounded-2xl border bg-card p-6">
					<div className="text-lg font-semibold">結果が見つからない</div>
					<p className="mt-2 text-sm text-muted-foreground">
						この結果はキャッシュから消えているか、URLが間違っているかもしれない。
					</p>
					<div className="mt-6 flex gap-2">
						<Button onClick={() => router.push("/tasks")} variant="secondary">
							課題一覧へ
						</Button>
						<Button onClick={() => router.back()}>戻る</Button>
					</div>
				</div>
			</div>
		);
	}

	const res = item.result as EvaluateResponse;
	const { total, passed, cases, isAllPassed } = toResultPanelProps(
		res,
		testTitles ?? undefined,
	);

	const src = isAllPassed
		? "/assets/characters/rejoicing.gif"
		: "/assets/characters/failing.gif";

	const headline = isAllPassed ? "全問正解！" : "不正解があるみたい";
	const outputText = res.ok ? extractText((res as EvaluateOk).output) : "";
	const hint =
		isAllPassed || total === 0
			? "いい感じ。次の課題へ進めるよ。"
			: "どこでズレたか、テスト結果を見て直してみよう。";

	const err = !res.ok ? (res as EvaluateErr).error : null;
	const kind = typeof err?.kind === "string" ? err.kind : "UNKNOWN";
	const msg = typeof err?.message === "string" ? err.message : "Unknown error";

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-10">
			<div className="mb-6 flex items-center justify-between gap-2">
				<Link href="/tasks" className="text-sm text-muted-foreground">
					← 課題一覧へ
				</Link>
				<div className="text-xs text-muted-foreground">
					ResultId: {resultId}
				</div>
			</div>

			<div className="space-y-6">
				<div className="rounded-2xl border bg-card p-4">
					<div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
						<img
							src={src}
							alt={isAllPassed ? "全問正解" : "不正解あり"}
							className="h-28 w-28 rounded-xl border bg-background object-cover"
						/>
						<div className="w-full">
							<div className="text-lg font-semibold">{headline}</div>
							<div className="mt-1 text-sm text-muted-foreground">{hint}</div>

							<div className="mt-3 flex flex-wrap items-center gap-2">
								<div className="rounded-full border bg-background px-3 py-1 text-xs">
									合格: {passed} / {total}
								</div>
								{item.taskId ? (
									<div className="rounded-full border bg-background px-3 py-1 text-xs">
										TaskId: {item.taskId}
									</div>
								) : null}
							</div>

							<div className="mt-4 flex flex-wrap gap-2">
								<Button
									onClick={() => router.push(`/tasks/${item.taskId ?? ""}`)}
									disabled={!item.taskId}
								>
									課題へ戻る
								</Button>
								<Button
									variant="secondary"
									onClick={() => router.push("/tasks")}
								>
									課題一覧
								</Button>
							</div>
						</div>
					</div>
				</div>

				{res.ok ? (
					<div className="rounded-2xl border bg-card p-4">
						<div className="text-sm font-semibold">出力</div>
						<pre className="mt-3 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border bg-background p-3 text-xs">
							{formatHumanReadable(outputText)}
						</pre>
					</div>
				) : (
					<div className="rounded-2xl border bg-card p-4">
						<div className="text-sm font-semibold">エラー</div>
						<div className="mt-2 text-sm text-muted-foreground">
							<span className="font-medium">{kind}</span>: {msg}
						</div>
					</div>
				)}

				<div className="rounded-2xl border bg-card p-4">
					<div className="flex items-center justify-between gap-2">
						<div className="text-sm font-semibold">テスト結果</div>
						<div className="text-xs text-muted-foreground">
							{cases.length} cases
						</div>
					</div>

					{cases.length === 0 ? (
						<p className="mt-2 text-sm text-muted-foreground">
							テスト結果が見つからない。
						</p>
					) : (
						<ul className="mt-3 space-y-2">
							{cases.map((c) => (
								<li
									key={c.index}
									className="rounded-lg border bg-background p-3"
								>
									<div className="flex items-center justify-between gap-2">
										<div className="text-sm font-medium">{c.title}</div>
										<div className="text-xs text-muted-foreground">
											{c.ok ? "OK" : "NG"}
										</div>
									</div>
									{c.detail ? (
										<pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
											{c.detail}
										</pre>
									) : null}
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</div>
	);
}
