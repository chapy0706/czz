// apps/user/app/result/page.tsx
"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { SfxLink as Link } from "@/components/ui/SfxLink";
import {
	type EvaluateResponse,
	EvaluateResponseSchema,
} from "@/lib/terminal/evaluateContract";
import { ResultPanel } from "@/lib/terminal/ResultPanel";
import {
	type CachedResult,
	useTerminalResultCacheStore,
} from "@/lib/terminal/terminalStore";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type ResultPanelProps = React.ComponentProps<typeof ResultPanel>;
type ResultStatus = ResultPanelProps["status"];

function safeStringify(x: unknown): string {
	try {
		return JSON.stringify(
			x,
			(_k, v) => (typeof v === "bigint" ? v.toString() : v),
			2,
		);
	} catch {
		return String(x);
	}
}

function extractText(x: unknown): string {
	if (x == null) return "";
	if (typeof x === "string") return x;
	if (typeof x === "number" || typeof x === "boolean") return String(x);

	if (typeof x === "object") {
		const any = x as Record<string, unknown>;
		const stdout = typeof any.stdout === "string" ? any.stdout : "";
		const stderr = typeof any.stderr === "string" ? any.stderr : "";
		const output = typeof any.output === "string" ? any.output : "";

		const blocks: string[] = [];
		if (output) blocks.push(output);
		if (stdout) blocks.push(`stdout:\n${stdout}`);
		if (stderr) blocks.push(`stderr:\n${stderr}`);

		if (blocks.length > 0) return blocks.join("\n\n");
	}

	return safeStringify(x);
}

type TaskTestCase = {
	title?: string | null;
	name?: string | null;
	label?: string | null;
};

async function fetchTaskTestTitles(taskId: string): Promise<string[]> {
	try {
		const res = await fetch(`/api/tasks/${taskId}`, {
			cache: "no-store",
			credentials: "same-origin",
		});
		if (!res.ok) return [];
		const json = (await res.json()) as any;
		if (json?.ok !== true) return [];
		const task = json?.value ?? json?.task ?? json?.value?.task ?? json?.value;
		const tcs = Array.isArray(task?.testCases)
			? (task.testCases as TaskTestCase[])
			: [];
		return tcs.map((tc, i) => {
			const t =
				(typeof tc?.title === "string" && tc.title) ||
				(typeof tc?.name === "string" && tc.name) ||
				(typeof tc?.label === "string" && tc.label);
			return t || `テスト ${i + 1}`;
		});
	} catch {
		return [];
	}
}

type CaseVerdict = {
	index: number;
	ok: boolean;
	title: string;
	detail?: string;
};

function isCaseOk(c: any): boolean {
	if (!c) return false;
	if (typeof c.ok === "boolean") return c.ok;
	if (typeof c.passed === "boolean") return c.passed;
	if (typeof c.success === "boolean") return c.success;
	if (typeof c.status === "string") return c.status.toLowerCase() === "pass";
	if (typeof c.result === "string") return c.result.toLowerCase() === "pass";
	return false;
}

function pickCaseTitle(
	c: any,
	index: number,
	overrideTitles?: string[],
): string {
	const o = Array.isArray(overrideTitles) ? overrideTitles[index] : undefined;
	if (typeof o === "string" && o.trim()) return o;

	const t =
		(typeof c?.title === "string" && c.title) ||
		(typeof c?.name === "string" && c.name) ||
		(typeof c?.label === "string" && c.label);
	return t || `テスト ${index + 1}`;
}

function pickCaseDetail(c: any): string | undefined {
	const parts: string[] = [];
	if (typeof c?.message === "string" && c.message) parts.push(c.message);
	if (c?.expected != null) parts.push(`expected:\n${extractText(c.expected)}`);
	if (c?.actual != null) parts.push(`actual:\n${extractText(c.actual)}`);
	if (c?.diff != null) parts.push(`diff:\n${extractText(c.diff)}`);

	const d = parts.join("\n\n").trim();
	return d ? d : undefined;
}

function extractCaseVerdicts(
	res: EvaluateResponse,
	overrideTitles?: string[],
): {
	cases: CaseVerdict[];
	passed: number;
	total: number;
	isAllPassed: boolean;
} {
	const any = res as any;

	const passedFromTop = typeof any?.passed === "number" ? any.passed : 0;
	const totalFromTop = typeof any?.total === "number" ? any.total : 0;

	const candidates: unknown[] = [
		any?.caseResults,
		any?.testResults,
		any?.results,
		any?.details?.caseResults,
		any?.details?.testResults,
		any?.details?.results,
		any?.details?.cases,
	];

	const arr = candidates.find((x) => Array.isArray(x)) as any[] | undefined;

	let cases: CaseVerdict[] = [];
	if (arr && arr.length > 0) {
		cases = arr.map((c, i) => ({
			index: i,
			ok: isCaseOk(c),
			title: pickCaseTitle(c, i, overrideTitles),
			detail: pickCaseDetail(c),
		}));
	} else if (totalFromTop > 0) {
		cases = Array.from({ length: totalFromTop }).map((_, i) => ({
			index: i,
			ok: i < passedFromTop,
			title:
				Array.isArray(overrideTitles) && overrideTitles[i]
					? overrideTitles[i]
					: `テスト ${i + 1}`,
		}));
	}

	const total = cases.length > 0 ? cases.length : totalFromTop;
	const passed =
		cases.length > 0 ? cases.filter((c) => c.ok).length : passedFromTop;

	const isAllPassed = res.ok && total > 0 ? passed === total : false;

	return { cases, passed, total, isAllPassed };
}

function toPanelProps(
	res: EvaluateResponse,
	overrideTitles?: string[],
): Pick<ResultPanelProps, "status" | "outputText" | "expectedText" | "hint"> {
	const ok = res.ok;

	const { passed, total, isAllPassed } = extractCaseVerdicts(
		res,
		overrideTitles,
	);
	const status: ResultStatus = isAllPassed ? "success" : "failure";

	if (ok) {
		const outputText = extractText((res as any).output);
		const hint =
			isAllPassed || total === 0
				? undefined
				: { title: "Test summary", detail: `passed ${passed} / ${total}` };

		return { status, outputText, expectedText: undefined, hint };
	}

	const err = (res as any)?.error;
	const kind = typeof err?.kind === "string" ? err.kind : "UNKNOWN";
	const msg = typeof err?.message === "string" ? err.message : "Unknown error";
	const details = err?.details != null ? `\n\n${extractText(err.details)}` : "";

	return {
		status: "failure",
		outputText: `${kind}: ${msg}${details}`,
		expectedText: undefined,
		hint: { title: "Error", detail: `${kind}: ${msg}` },
	};
}

function CaseList({
	cases,
	compact,
}: {
	cases: CaseVerdict[];
	compact: boolean;
}) {
	if (cases.length === 0) return null;

	return (
		<div className="rounded-2xl border bg-card p-4" data-testid="case-list">
			<div className="text-sm font-semibold">テスト結果</div>
			<ul className="mt-3 space-y-2">
				{cases.map((c) => (
					<li
						key={c.index}
						className="flex items-start justify-between gap-3 rounded-lg border bg-background px-3 py-2"
					>
						<div className="min-w-0">
							<div className="text-sm font-medium">{c.title}</div>
							{!compact && c.detail ? (
								<pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted/40 p-2 text-xs text-muted-foreground">
									{c.detail}
								</pre>
							) : null}
						</div>
						<div className="shrink-0 rounded-full border px-2 py-1 text-xs">
							{c.ok ? "○ 正解" : "× 不正解"}
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}

function BeginnerResultView({
	cases,
	isAllPassed,
	onRetry,
	onBackToTasks,
}: {
	cases: CaseVerdict[];
	isAllPassed: boolean;
	onRetry: () => void;
	onBackToTasks: () => void;
}) {
	const src = isAllPassed
		? "/assets/characters/rejoicing.gif"
		: "/assets/characters/failing.gif";

	return (
		<div className="mt-6 space-y-4">
			<div className="rounded-2xl border bg-card p-4">
				<div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
					<img
						src={src}
						alt={isAllPassed ? "全問正解" : "不正解あり"}
						className="h-28 w-28 rounded-xl border bg-background object-cover"
					/>
					<div className="w-full">
						<div className="text-lg font-semibold">
							{isAllPassed ? "ぜんぶ せいかい！" : "あと すこし！"}
						</div>
						<p className="mt-1 text-sm text-muted-foreground">
							{isAllPassed
								? "やったね。つぎの問題もいけるよ。"
								: "まちがいがあるところだけ、もういちどためしてみよう。"}
						</p>

						<div className="mt-3 flex flex-wrap gap-2">
							<button
								type="button"
								className="rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent"
								onClick={onRetry}
								data-testid="beginner-retry"
							>
								もういちど
							</button>
							<button
								type="button"
								className="rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent"
								onClick={onBackToTasks}
								data-testid="beginner-back"
							>
								もどる
							</button>
						</div>
					</div>
				</div>
			</div>

			<CaseList cases={cases} compact />
		</div>
	);
}

export default function ResultPage() {
	const router = useRouter();
	const mode = useUiModeStore((s) => s.mode);
	const isBeginner = mode === "beginner";

	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => setMounted(true), []);

	const { latestId, byId, clearAll } = useTerminalResultCacheStore((s) => ({
		latestId: s.latestId,
		byId: s.byId,
		clearAll: s.clearAll,
	}));
	const stored = React.useMemo<CachedResult | null>(() => {
		if (!latestId) return null;
		return byId[latestId] ?? null;
	}, [byId, latestId]);
	const [panel, setPanel] = React.useState<Pick<
		ResultPanelProps,
		"status" | "outputText" | "expectedText" | "hint"
	> | null>(null);
	const [cases, setCases] = React.useState<CaseVerdict[]>([]);
	const [isAllPassed, setIsAllPassed] = React.useState(false);
	const [testTitles, setTestTitles] = React.useState<string[]>([]);

	React.useEffect(() => {
		if (!mounted) return;

		if (!stored) {
			setPanel(null);
			setCases([]);
			setIsAllPassed(false);
			return;
		}
		const parsed = EvaluateResponseSchema.safeParse(stored.response);
		if (!parsed.success) {
			setPanel({
				status: "failure",
				outputText: "Invalid stored result (schema mismatch).",
				expectedText: undefined,
				hint: { title: "Storage", detail: parsed.error.message },
			});
			setCases([]);
			setIsAllPassed(false);
			return;
		}

		const res = parsed.data;
		const verdict = extractCaseVerdicts(res, testTitles);

		setCases(verdict.cases);
		setIsAllPassed(verdict.isAllPassed);
		setPanel(toPanelProps(res, testTitles));
	}, [mounted, stored, testTitles]);

	const savedAtText = React.useMemo(() => {
		if (!stored) return "";
		try {
			return new Date(stored.savedAt).toLocaleString();
		} catch {
			return String(stored.savedAt);
		}
	}, [stored]);

	const taskId = stored?.meta?.taskId;

	React.useEffect(() => {
		let alive = true;
		if (!taskId) {
			setTestTitles([]);
			return;
		}
		fetchTaskTestTitles(taskId).then((titles) => {
			if (!alive) return;
			setTestTitles(titles);
		});
		return () => {
			alive = false;
		};
	}, [taskId]);

	const clear = React.useCallback(() => {
		clearAll();
		setPanel(null);
		setCases([]);
		setIsAllPassed(false);
	}, [clearAll]);

	const onRetry = React.useCallback(() => {
		if (taskId) {
			router.push(`/tasks/${taskId}`);
			return;
		}
		router.push("/tasks");
	}, [router, taskId]);

	const onBackToTasks = React.useCallback(() => {
		router.push("/tasks");
	}, [router]);

	return (
		<main className="mx-auto max-w-5xl px-6 py-10" data-testid="result-page">
			<div className="flex items-baseline justify-between gap-3">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight">リザルト</h1>
					<p className="text-sm text-muted-foreground">
						直近の実行結果（localStorage 保存）を表示する。
					</p>
				</div>

				<div className="flex items-center gap-3">
					<Link
						href="/tasks"
						className="text-sm text-muted-foreground hover:underline"
					>
						課題一覧へ
					</Link>
					<Link
						href="/"
						className="text-sm text-muted-foreground hover:underline"
					>
						TOPへ
					</Link>
				</div>
			</div>

			{!mounted ? (
				<div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
					読み込み中…
				</div>
			) : !panel ? (
				<div className="mt-6 space-y-3">
					<div
						className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground"
						data-testid="result-empty"
					>
						まだリザルトがないよ。タスクを実行してから戻ってきてね。
					</div>
					<div className="flex items-center gap-3 text-sm">
						{taskId ? (
							<Link
								href={`/tasks/${taskId}`}
								className="text-muted-foreground hover:underline"
							>
								タスクへ戻る
							</Link>
						) : null}
					</div>
				</div>
			) : isBeginner ? (
				<BeginnerResultView
					cases={cases}
					isAllPassed={isAllPassed}
					onRetry={onRetry}
					onBackToTasks={onBackToTasks}
				/>
			) : (
				<div className="mt-6 space-y-3">
					<div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
						<div data-testid="result-saved-at">savedAt: {savedAtText}</div>
						<button
							type="button"
							className="rounded border bg-background px-3 py-1 hover:bg-accent"
							onClick={clear}
							data-testid="result-clear"
						>
							クリア
						</button>
					</div>

					<CaseList cases={cases} compact={false} />

					<ResultPanel
						status={panel.status}
						outputText={panel.outputText}
						expectedText={panel.expectedText}
						hint={panel.hint}
						onRetry={onRetry}
						onBackToTasks={onBackToTasks}
					/>
				</div>
			)}
		</main>
	);
}
