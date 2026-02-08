// apps/user/app/results/[resultId]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type ApiOk<T> = { ok: true; value: T };
type ApiErr = { ok: false; error?: { kind?: string; message?: string } };
type ApiResponse<T> = ApiOk<T> | ApiErr;

type CaseVerdict = {
	index: number;
	title: string;
	ok: boolean;
	detail?: string;
};

type EvaluateOkShape = {
	passed?: number;
	total?: number;
	allPassed?: boolean;
	results?: unknown;
	testResults?: unknown;
	testcases?: unknown;
	cases?: unknown;
	output?: unknown;
};

function extractText(value: unknown): string {
	if (typeof value === "string") return value;
	if (typeof value === "number") return String(value);
	if (Array.isArray(value)) return value.map(extractText).join("\n");

	if (value && typeof value === "object") {
		const obj = value as Record<string, unknown>;
		if (typeof obj.text === "string") return obj.text;
		if (typeof obj.stdout === "string") return obj.stdout;
		if (typeof obj.output === "string") return obj.output;
		if (typeof obj.value === "string") return obj.value;
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}
	return "";
}

function isCaseOk(c: unknown): boolean {
	if (!c || typeof c !== "object") return false;
	const obj = c as Record<string, unknown>;
	if (typeof obj.ok === "boolean") return obj.ok;
	if (typeof obj.passed === "boolean") return obj.passed;
	if (typeof obj.success === "boolean") return obj.success;
	return false;
}

function pickCaseTitle(c: unknown, index: number, overrideTitles?: string[]): string {
	if (overrideTitles?.[index]) return overrideTitles[index] ?? `ケース ${index + 1}`;
	if (!c || typeof c !== "object") return `ケース ${index + 1}`;
	const obj = c as Record<string, unknown>;
	if (typeof obj.title === "string" && obj.title) return obj.title;
	if (typeof obj.name === "string" && obj.name) return obj.name;
	return `ケース ${index + 1}`;
}

function pickCaseDetail(c: unknown): string | undefined {
	if (!c || typeof c !== "object") return undefined;
	const obj = c as Record<string, unknown>;

	const parts: string[] = [];
	if (typeof obj.message === "string" && obj.message) parts.push(obj.message);
	if (typeof obj.detail === "string" && obj.detail) parts.push(obj.detail);
	if (typeof obj.stderr === "string" && obj.stderr) parts.push(obj.stderr);

	const got = parts.join("\n").trim();
	return got.length > 0 ? got : undefined;
}

function normalizeCases(res: ApiResponse<EvaluateOkShape>): {
	total: number;
	passed: number;
	isAllPassed: boolean;
	cases: CaseVerdict[];
	outputText?: string;
	err?: { kind: string; message: string };
} {
	if (!res.ok) {
		const kind = typeof res.error?.kind === "string" ? res.error.kind : "UNKNOWN";
		const message = typeof res.error?.message === "string" ? res.error.message : "Unknown error";
		return { total: 0, passed: 0, isAllPassed: false, cases: [], err: { kind, message } };
	}

	const v = res.value;
	const passedFromTop = typeof v.passed === "number" ? v.passed : 0;
	const totalFromTop = typeof v.total === "number" ? v.total : 0;

	const candidates: unknown[] = [
		v.results,
		v.testResults,
		v.testcases,
		v.cases,
	].filter((x) => x !== undefined);

	const arr = candidates.find((x) => Array.isArray(x)) as unknown[] | undefined;

	const cases: CaseVerdict[] = Array.isArray(arr)
		? arr.map((c, idx) => ({
				index: idx,
				title: pickCaseTitle(c, idx, undefined),
				ok: isCaseOk(c),
				detail: pickCaseDetail(c),
			}))
		: [];

	const total = totalFromTop > 0 ? totalFromTop : cases.length;
	const passed = passedFromTop > 0 ? passedFromTop : cases.filter((c) => c.ok).length;
	const isAllPassed =
		typeof v.allPassed === "boolean" ? v.allPassed : total > 0 ? passed === total : false;

	const outputText = extractText(v.output).trim() || undefined;

	return { total, passed, isAllPassed, cases, outputText };
}

async function fetchResult(resultId: string): Promise<ApiResponse<EvaluateOkShape> | null> {
	const base = process.env.NEXT_PUBLIC_APP_URL;
	const url = base ? `${base}/api/results/${encodeURIComponent(resultId)}` : null;

	try {
		const res = await fetch(url ?? `/api/results/${encodeURIComponent(resultId)}`, {
			cache: "no-store",
			next: { revalidate: 0 },
		});
		const text = await res.text().catch(() => "");
		const json: unknown = text ? JSON.parse(text) : null;

		if (!res.ok || !json || typeof json !== "object") return { ok: false };
		return json as ApiResponse<EvaluateOkShape>;
	} catch {
		return null;
	}
}

export default async function ResultPage({
	params,
}: {
	params: Promise<{ resultId: string }>;
}) {
	const { resultId } = await params;
	if (!resultId) notFound();

	const data = await fetchResult(resultId);
	if (!data) notFound();

	const normalized = normalizeCases(data);

	const headline = normalized.err
		? "実行に失敗したよ"
		: normalized.isAllPassed
			? "全問正解！"
			: "惜しい…不正解があるよ";

	const src = normalized.isAllPassed
		? "/images/result_success.webp"
		: "/images/result_fail.webp";

	return (
		<main className="mx-auto w-full max-w-3xl space-y-6 p-4">
			<Card className="rounded-2xl border bg-card p-4">
				<div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
					<Image
						src={src}
						alt={normalized.isAllPassed ? "全問正解" : "不正解あり"}
						width={112}
						height={112}
						className="h-28 w-28 rounded-xl border bg-background object-cover"
						priority
					/>
					<div className="w-full">
						<div className="text-lg font-semibold">{headline}</div>
						<div className="mt-1 text-sm text-muted-foreground">
							{normalized.err ? (
								<>
									{normalized.err.kind}: {normalized.err.message}
								</>
							) : (
								<>
									正解 {normalized.passed} / {normalized.total}
								</>
							)}
						</div>

						<div className="mt-3 flex flex-wrap gap-2">
							<Button asChild variant="secondary">
								<Link href="/tasks">課題一覧へ戻る</Link>
							</Button>
							<Button asChild>
								<Link href="/results/running">もう一度試す</Link>
							</Button>
						</div>
					</div>
				</div>

				{normalized.outputText ? (
					<>
						<Separator className="my-4" />
						<div className="text-sm font-semibold">出力</div>
						<pre className="mt-2 max-h-72 overflow-auto rounded-xl border bg-background p-3 text-xs leading-relaxed">
							{normalized.outputText}
						</pre>
					</>
				) : null}

				{normalized.cases.length > 0 ? (
					<>
						<Separator className="my-4" />
						<div className="text-sm font-semibold">テスト結果</div>
						<ul className="mt-3 space-y-2">
							{normalized.cases.map((c) => (
								<li key={c.index} className="rounded-lg border bg-background p-3">
									<div className="flex items-center justify-between gap-2">
										<div className="text-sm font-medium">{c.title}</div>
										<div className="text-xs text-muted-foreground">
											{c.ok ? "OK" : "NG"}
										</div>
									</div>
									{c.detail ? (
										<pre className="mt-2 overflow-auto rounded border bg-muted p-2 text-xs">
											{c.detail}
										</pre>
									) : null}
								</li>
							))}
						</ul>
					</>
				) : null}
			</Card>
		</main>
	);
}
