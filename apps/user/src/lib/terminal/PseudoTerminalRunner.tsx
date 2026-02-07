// apps/user/src/lib/terminal/PseudoTerminalRunner.tsx
"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { ResultPanel } from "@/lib/terminal/ResultPanel";
import { evaluateTask } from "@/lib/terminal/evaluateClient";

import { debugRegistry } from "@/components/debug/debugRegistry";

type Props = {
	/**
	 * 互換のため、taskId / task のどちらでも受け取れるようにする。
	 * - 従来: <PseudoTerminalRunner taskId="..." />
	 * - 新:   <PseudoTerminalRunner task={{ id: "..." }} />
	 */
	taskId?: string;
	task?: { id: string };

	userId?: string;

	/**
	 * true の場合、Run 後に /result へ遷移する
	 */
	navigateOnRun?: boolean;
};

type UiResultStatus = "success" | "failure";
type UiResult = {
	status: UiResultStatus;
	outputText: string;
	expectedText?: string;
	hint?: { title?: string; detail: string };
};

function formatHumanReadable(value: unknown): string {
	// JSON ベタ表示を避け、配列は "a, b, c" で見せる
	if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean")
		return String(value);
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

export function PseudoTerminalRunner({
	taskId,
	task,
	userId,
	navigateOnRun,
}: Props) {
	// Debug: rendered marker（Hook は必ずコンポーネント内）
	React.useEffect(() => {
		debugRegistry.markRendered("PseudoTerminalRunner");
		return () => debugRegistry.unmarkRendered("PseudoTerminalRunner");
	}, []);

	const resolvedTaskId = taskId ?? task?.id;
	const router = useRouter();

	const [running, setRunning] = React.useState(false);
	const [inputText, setInputText] = React.useState<string>("2, 3, 5, 7, 0");
	const [outputText, setOutputText] = React.useState<string>("");
	const [uiResult, setUiResult] = React.useState<UiResult | null>(null);

	const onClear = React.useCallback(() => {
		setOutputText("");
		setUiResult(null);
	}, []);

	const onRun = React.useCallback(async () => {
		if (!resolvedTaskId) return;

		setRunning(true);
		setUiResult(null);

		const res = await evaluateTask({
			taskId: resolvedTaskId,
			userId,
			submittedProgram: undefined,
			// debugInput / dryRun がサーバ未対応でも落とさない（未対応なら error 側でメッセージ表示）
			debugInput: inputText,
			dryRun: true,
		} as any);

		setRunning(false);

		// ok が boolean に広がる実装差分があっても壊れないように、存在判定で分岐する
		if ("error" in res) {
			const msg =
				(res as any).error && typeof (res as any).error.message === "string"
					? (res as any).error.message
					: "Unknown error";

			setOutputText(`Error: ${msg}`);
			setUiResult({
				status: "failure",
				outputText: `Error: ${msg}`,
				hint: { detail: "Server may not support debugInput/dryRun yet." },
			});
			return;
		}

		const text = formatHumanReadable((res as any).output);
		setOutputText(text);
		setUiResult({ status: "success", outputText: text });

		if (navigateOnRun) {
			router.push("/result");
		}
	}, [resolvedTaskId, userId, navigateOnRun, router, inputText]);

	if (!resolvedTaskId) {
		return (
			<div className="rounded-2xl border bg-card p-4 text-sm">
				Task ID is missing. (taskId / task.id)
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="text-sm text-muted-foreground">Playground</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="rounded-md border px-3 py-1 text-xs"
						onClick={onClear}
						disabled={running}
					>
						Clear
					</button>
					<button
						type="button"
						className="rounded-md border px-3 py-1 text-xs"
						onClick={onRun}
						disabled={running}
					>
						{running ? "Running..." : "Run"}
					</button>
				</div>
			</div>

			<div className="rounded-2xl border bg-card p-3">
				<div className="text-xs text-muted-foreground">Input</div>
				<input
					className="mt-1 w-full rounded-md border bg-background px-2 py-1 text-sm"
					value={inputText}
					onChange={(e) => setInputText(e.target.value)}
					disabled={running}
				/>
				<div className="mt-3 text-xs text-muted-foreground">Output</div>
				<div className="mt-1 whitespace-pre-wrap rounded-md border bg-background px-2 py-2 text-sm">
					{outputText || "—"}
				</div>
			</div>

			{uiResult ? (
				<ResultPanel
					status={uiResult.status}
					outputText={uiResult.outputText}
					expectedText={uiResult.expectedText}
					hint={uiResult.hint}
					onRetry={onRun}
				/>
			) : null}
		</div>
	);
}
