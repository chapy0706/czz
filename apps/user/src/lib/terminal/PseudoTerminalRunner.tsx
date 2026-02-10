// apps/user/src/lib/terminal/PseudoTerminalRunner.tsx
"use client";

import * as React from "react";
import { debugRegistry } from "@/components/debug/debugRegistry";
import { runPlayground } from "@/lib/terminal/playgroundClient";
import { ResultPanel } from "@/lib/terminal/ResultPanel";

type Props = {
	/**
	 * 互換のため、taskId / task のどちらでも受け取れるようにする。
	 * - 従来: <PseudoTerminalRunner taskId="..." />
	 * - 新:   <PseudoTerminalRunner task={{ id: "..." }} />
	 */
	taskId?: string;
	task?: { id: string };

	/**
	 * 実行用の DSL プログラムを取得する
	 */
	getSubmittedProgram: () => unknown;
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

const PRESET_OPTIONS = [
	{ key: "preset-0", label: "[2,3,5,7,0]" },
	{ key: "preset-1", label: "[1,2,3,4,5]" },
	{ key: "preset-2", label: "[10,1,5,3]" },
	{ key: "random", label: "ランダム" },
] as const;

const PRESET_VALUES: Record<"preset-0" | "preset-1" | "preset-2", number[]> = {
	"preset-0": [2, 3, 5, 7, 0],
	"preset-1": [1, 2, 3, 4, 5],
	"preset-2": [10, 1, 5, 3],
};

type PresetKey = keyof typeof PRESET_VALUES | "random";
type RangeKey = "0-9" | "0-99";

export function PseudoTerminalRunner({
	taskId,
	task,
	getSubmittedProgram,
}: Props) {
	// Debug: rendered marker（Hook は必ずコンポーネント内）
	React.useEffect(() => {
		debugRegistry.markRendered("PseudoTerminalRunner");
		return () => debugRegistry.unmarkRendered("PseudoTerminalRunner");
	}, []);

	const resolvedTaskId = taskId ?? task?.id;

	const [running, setRunning] = React.useState(false);
	const [presetKey, setPresetKey] = React.useState<PresetKey>("preset-0");
	const [randomLength, setRandomLength] = React.useState(5);
	const [randomRange, setRandomRange] = React.useState<RangeKey>("0-9");
	const [randomInput, setRandomInput] = React.useState<number[]>([]);
	const [outputText, setOutputText] = React.useState<string>("");
	const [uiResult, setUiResult] = React.useState<UiResult | null>(null);
	const [errorSummary, setErrorSummary] = React.useState<string | null>(null);
	const [errorDetails, setErrorDetails] = React.useState<string | null>(null);

	const inputNumbers =
		presetKey === "random" ? randomInput : PRESET_VALUES[presetKey];

	const onClear = React.useCallback(() => {
		setOutputText("");
		setUiResult(null);
		setErrorSummary(null);
		setErrorDetails(null);
	}, []);

	const generateRandom = React.useCallback(() => {
		const length = Math.max(3, Math.min(10, randomLength));
		const max = randomRange === "0-9" ? 9 : 99;
		const next = Array.from({ length }, () =>
			Math.floor(Math.random() * (max + 1)),
		);
		setRandomInput(next);
	}, [randomLength, randomRange]);

	const onRun = React.useCallback(async () => {
		if (!resolvedTaskId) return;
		if (presetKey === "random" && randomInput.length === 0) return;

		setRunning(true);
		setUiResult(null);
		setErrorSummary(null);
		setErrorDetails(null);

		const res = await runPlayground({
			debugInput: inputNumbers,
			submittedProgram: getSubmittedProgram(),
		});

		setRunning(false);

		if (!res.ok) {
			const err = "error" in res ? res.error : undefined;
			const msg = err?.message ?? "Unknown error";
			setOutputText("");
			setUiResult(null);
			setErrorSummary(msg);
			setErrorDetails(
				err?.details !== undefined
					? formatHumanReadable(err.details)
					: "詳細情報がありません。",
			);
			return;
		}

		const text = formatHumanReadable(res.output);
		setOutputText(text);
		setUiResult({ status: "success", outputText: text });
	}, [
		resolvedTaskId,
		presetKey,
		randomInput.length,
		inputNumbers,
		getSubmittedProgram,
	]);

	if (!resolvedTaskId) {
		return (
			<div className="rounded-2xl border bg-card p-4 text-sm">
				課題IDが見つかりません (taskId / task.id)
			</div>
		);
	}

	const canRun = !running && (presetKey !== "random" || randomInput.length > 0);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="text-sm text-muted-foreground">プレイグラウンド</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="rounded-md border px-3 py-1 text-xs"
						onClick={onClear}
						disabled={running}
					>
						クリア
					</button>
					<button
						type="button"
						className="rounded-md border px-3 py-1 text-xs"
						onClick={onRun}
						disabled={!canRun}
					>
						{running ? "実行中…" : "実行"}
					</button>
				</div>
			</div>

			<div className="rounded-2xl border bg-card p-3">
				<div className="text-xs text-muted-foreground">入力</div>
				<div className="mt-2 space-y-2">
					<select
						className="w-full rounded-md border bg-background px-2 py-1 text-sm"
						value={presetKey}
						onChange={(e) => setPresetKey(e.target.value as PresetKey)}
						disabled={running}
					>
						{PRESET_OPTIONS.map((option) => (
							<option key={option.key} value={option.key}>
								{option.label}
							</option>
						))}
					</select>

					{presetKey === "random" ? (
						<div className="flex flex-wrap items-center gap-2 text-xs">
							<label className="flex items-center gap-1">
								<span>長さ</span>
								<select
									className="rounded-md border bg-background px-2 py-1"
									value={randomLength}
									onChange={(e) => setRandomLength(Number(e.target.value))}
									disabled={running}
								>
									{Array.from({ length: 8 }, (_, i) => i + 3).map((v) => (
										<option key={v} value={v}>
											{v}
										</option>
									))}
								</select>
							</label>
							<label className="flex items-center gap-1">
								<span>値域</span>
								<select
									className="rounded-md border bg-background px-2 py-1"
									value={randomRange}
									onChange={(e) => setRandomRange(e.target.value as RangeKey)}
									disabled={running}
								>
									<option value="0-9">0-9</option>
									<option value="0-99">0-99</option>
								</select>
							</label>
							<button
								type="button"
								className="rounded-md border px-2 py-1"
								onClick={generateRandom}
								disabled={running}
							>
								生成
							</button>
						</div>
					) : null}

					<div className="rounded-md border bg-background px-2 py-2 text-sm">
						{inputNumbers.length > 0 ? inputNumbers.join(", ") : "—"}
					</div>
				</div>

				<div className="mt-3 text-xs text-muted-foreground">出力</div>
				<div className="mt-1 whitespace-pre-wrap rounded-md border bg-background px-2 py-2 text-sm">
					{outputText || "—"}
				</div>
			</div>

			{errorSummary ? (
				<div className="rounded border p-3 text-sm">
					<div className="font-semibold">{errorSummary}</div>
					<details className="mt-2">
						<summary className="cursor-pointer">詳細</summary>
						<div className="mt-2 whitespace-pre-wrap text-xs">
							{errorDetails ?? "詳細情報がありません。"}
						</div>
					</details>
				</div>
			) : null}

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
