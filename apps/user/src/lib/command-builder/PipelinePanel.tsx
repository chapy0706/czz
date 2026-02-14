// apps/user/src/lib/command-builder/PipelinePanel.tsx
"use client";

import { useParams } from "next/navigation";
import * as React from "react";
import { debugRegistry } from "@/components/debug/debugRegistry";
import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
import {
	type CommandType,
	getCatalogItem,
	isCommandType,
} from "@/lib/command-builder/commandCatalog";
import { isRecord } from "@/lib/shared/unknown";
import {
	isRunnerIoCorrect,
	RUNNER_INPUT_PRESETS,
	RUNNER_OUTPUT_PRESETS,
	type RunnerInputPreset,
	type RunnerOutputPreset,
	runnerInputCmd,
	runnerOutputCmd,
} from "@/lib/terminal/runnerIo";
import { useRunToResultButton } from "@/lib/terminal/useRunToResultButton";

type CommandDraft = {
	id: string;
	value: unknown;
};

type Props = {
	commands: CommandDraft[];
	selectedId: string | null;

	selectedIndex: number;
	revealIndex: number;
	onStepPlus: () => void;
	onStepMinus: () => void;
	onSelectNext: () => void;
	onSelectStep: (index: number) => void;
};

function getTaskIdFromParams(
	params: ReturnType<typeof useParams>,
): string | null {
	if (!params || !isRecord(params)) return null;
	const v = params.taskId;
	if (typeof v === "string") return v;
	if (Array.isArray(v)) return v[0] ?? null;
	return null;
}

function cmdTypeOf(value: unknown): CommandType | null {
	if (!isRecord(value)) return null;
	const t = value.type;
	if (typeof t !== "string") return null;
	if (!isCommandType(t)) return null;
	return t;
}

function substitute(template: string, value: unknown) {
	if (!isRecord(value)) return template;

	return template.replace(/\{\{(\w+)\}\}/g, (_m, key) => {
		const v = value[key];
		if (v === undefined || v === null) return "";
		if (Array.isArray(v)) return v.join(", ");
		return String(v);
	});
}

function unixHintFor(value: unknown): string {
	const t = cmdTypeOf(value);
	if (!t) return "<?>";

	const item = getCatalogItem(t);
	if (!item.unixHint) return item.label;

	return substitute(item.unixHint, value);
}

type DragState = {
	active: boolean;
	startX: number;
	startY: number;
	index: number;
	moved: boolean;
	pointerId: number;
};

export function PipelinePanel(props: Props) {
	React.useEffect(() => {
		debugRegistry.markRendered("PipelinePanel");
		return () => debugRegistry.unmarkRendered("PipelinePanel");
	}, []);

	const {
		commands,
		selectedId,
		selectedIndex,
		revealIndex,
		onStepPlus,
		onStepMinus,
		onSelectNext,
		onSelectStep,
	} = props;

	const params = useParams();
	const taskId = React.useMemo(() => getTaskIdFromParams(params), [params]);

	const programDigest = React.useMemo(
		() => JSON.stringify(commands.map((c) => c.value)),
		[commands],
	);

	const run = useRunToResultButton({
		taskId,
		resetKey: programDigest,
		getSubmittedProgram: () =>
			useCommandBuilderStore.getState().serializeProgram(),
		getRunnerIo: () => useCommandBuilderStore.getState().runnerIo,
		navigateTo: "/result",
		autoNavigateOnComplete: true,
	});

	const moveCommand = useCommandBuilderStore((s) => s.move);

	const runnerIo = useCommandBuilderStore((s) => s.runnerIo);
	const setRunnerInput = useCommandBuilderStore((s) => s.setRunnerInput);
	const setRunnerOutput = useCommandBuilderStore((s) => s.setRunnerOutput);

	const runnerOk = isRunnerIoCorrect(runnerIo);

	const runDisabled = run.disabled || !runnerOk;
	const runTitle = !runnerOk
		? "Runner の入出力（cat / 出力先）を選んでね"
		: run.title;

	const canStepPlus = selectedIndex >= 0 && revealIndex < commands.length;
	const canStepMinus = selectedIndex >= 0;

	const stripRef = React.useRef<HTMLDivElement | null>(null);
	React.useEffect(() => {
		if (!stripRef.current) return;
		const el = stripRef.current.querySelectorAll<HTMLElement>(
			"[data-testid='pipe-step']",
		)?.[selectedIndex];
		el?.scrollIntoView({ inline: "center", block: "nearest" });
	}, [selectedIndex]);

	const dragRef = React.useRef<DragState | null>(null);

	const onChipPointerDown = React.useCallback(
		(e: React.PointerEvent, index: number) => {
			(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
			dragRef.current = {
				active: true,
				startX: e.clientX,
				startY: e.clientY,
				index,
				moved: false,
				pointerId: e.pointerId,
			};
		},
		[],
	);

	const onChipPointerMove = React.useCallback(
		(e: React.PointerEvent) => {
			const st = dragRef.current;
			if (!st || !st.active || st.pointerId !== e.pointerId) return;

			const dx = e.clientX - st.startX;
			const dy = e.clientY - st.startY;

			const threshX = 18;
			const threshDominance = 1.2;

			if (!st.moved) {
				if (Math.abs(dx) < threshX) return;
				if (Math.abs(dx) < Math.abs(dy) * threshDominance) return;
				st.moved = true;
			}

			const dir = dx > 0 ? 1 : -1;
			const nextIndex = st.index + dir;
			if (nextIndex < 0 || nextIndex >= commands.length) return;

			moveCommand(st.index, nextIndex);
			st.index = nextIndex;
			st.startX = e.clientX;
			st.startY = e.clientY;
		},
		[commands.length, moveCommand],
	);

	const onChipPointerUp = React.useCallback((e: React.PointerEvent) => {
		const st = dragRef.current;
		if (!st || st.pointerId !== e.pointerId) return;
		dragRef.current = null;
	}, []);

	const revealed = React.useMemo(() => {
		if (selectedIndex < 0) return [];
		const from = selectedIndex;
		const to = Math.min(
			Math.max(revealIndex, selectedIndex),
			commands.length - 1,
		);
		return commands.slice(from, to + 1);
	}, [commands, selectedIndex, revealIndex]);

	const pipelineText = React.useMemo(() => {
		const left = runnerInputCmd(runnerIo.input);
		const right = runnerOutputCmd(runnerIo.output);
		const mids = commands.map((c) => unixHintFor(c.value)).join(" | ");
		const mid = mids || "未選択";
		return `${left} | ${mid} ${right}`;
	}, [commands, runnerIo]);

	return (
		<div className="rounded border p-3">
			<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<div className="text-xs font-semibold opacity-70">Runner</div>

					<label className="flex items-center gap-2 text-xs">
						入力
						<select
							className="rounded border px-2 py-1 text-xs"
							value={runnerIo.input ?? "unset"}
							onChange={(e) =>
								setRunnerInput(
									e.target.value === "unset"
										? null
										: (e.target.value as RunnerInputPreset),
								)
							}
						>
							{RUNNER_INPUT_PRESETS.map((p) => (
								<option key={p} value={p}>
									{runnerInputCmd(p)}
								</option>
							))}
						</select>
					</label>

					<label className="flex items-center gap-2 text-xs">
						出力
						<select
							className="rounded border px-2 py-1 text-xs"
							value={runnerIo.output ?? "unset"}
							onChange={(e) =>
								setRunnerOutput(
									e.target.value === "unset"
										? null
										: (e.target.value as RunnerOutputPreset),
								)
							}
						>
							{RUNNER_OUTPUT_PRESETS.map((p) => (
								<option key={p} value={p}>
									{runnerOutputCmd(p)}
								</option>
							))}
						</select>
					</label>
				</div>

				<button
					type="button"
					className="rounded border px-3 py-2 text-sm disabled:opacity-50"
					data-testid="cb-run"
					onClick={run.onClick}
					disabled={runDisabled}
					title={runTitle}
				>
					{run.label}
				</button>
			</div>

			{!runnerOk ? (
				<div className="mb-2 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
					stdin は入力、stdout は出力。cat と &gt;&gt; を選ぶと実行できるよ
				</div>
			) : null}

			<div className="mb-2 rounded bg-muted/40 px-3 py-2 font-mono text-xs">
				{pipelineText}
			</div>

			<div className="mb-2 flex items-center gap-2">
				<button
					type="button"
					className="rounded border px-2 py-1 text-xs disabled:opacity-50"
					onClick={onStepMinus}
					disabled={!canStepMinus}
				>
					1つ戻す
				</button>
				<button
					type="button"
					className="rounded border px-2 py-1 text-xs disabled:opacity-50"
					onClick={onStepPlus}
					disabled={!canStepPlus}
				>
					1つ進める
				</button>
				<button
					type="button"
					className="rounded border px-2 py-1 text-xs disabled:opacity-50"
					onClick={onSelectNext}
					disabled={selectedIndex < 0}
				>
					次へ
				</button>

				<div className="ml-auto text-xs opacity-70">
					ドラッグで並び替え（横方向）
				</div>
			</div>

			<div ref={stripRef} className="flex gap-2 overflow-x-auto pb-1">
				{commands.map((c, i) => {
					const selected = c.id === selectedId;
					const label = unixHintFor(c.value);

					return (
						<button
							key={c.id}
							type="button"
							data-testid="pipe-step"
							className={[
								"shrink-0 rounded border px-3 py-2 text-xs",
								selected ? "bg-muted" : "bg-background",
							].join(" ")}
							onClick={() => onSelectStep(i)}
							onPointerDown={(e) => onChipPointerDown(e, i)}
							onPointerMove={onChipPointerMove}
							onPointerUp={onChipPointerUp}
							onPointerCancel={onChipPointerUp}
							title={label}
						>
							{label}
						</button>
					);
				})}
			</div>

			{revealed.length > 0 ? (
				<div className="mt-2 text-xs opacity-70">
					表示中: {revealed.length} / {commands.length}
				</div>
			) : null}
		</div>
	);
}
