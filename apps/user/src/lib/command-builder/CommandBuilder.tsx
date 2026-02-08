// apps/user/src/lib/command-builder/CommandBuilder.tsx
"use client";

import * as React from "react";

import { CommandList } from "@/lib/command-builder/CommandList";
import { CommandPalette } from "@/lib/command-builder/CommandPalette";
import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
import { PipelinePanel } from "@/lib/command-builder/PipelinePanel";
import { buildResetKey } from "@/lib/command-builder/serialize";
import { getString, isRecord } from "@/lib/shared/unknown";
import { useRunToResultButton } from "@/lib/terminal/useRunToResultButton";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type Task = {
	id: string;
	title: string;
	description: string;
	isPublished: boolean;
};

type Props = {
	task: Task;
	userId?: string;
};

type UiModeForPanels = "beginner" | "normal";

function toCommandToken(command: unknown): string {
	// command は store の Draft なので、型を信用せずに "それっぽい" 文字列へ安全に落とす
	const c = isRecord(command) ? command : null;
	const v = isRecord(c?.value) ? c?.value : null;
	const t1 = getString(v, "type");
	const t2 = getString(c, "type");
	const t = t1 ?? t2 ?? "CMD";
	return String(t);
}

export function CommandBuilder(props: Props) {
	const { task, userId } = props;

	// "advanced" | "beginner"
	const mode = useUiModeStore((s) => s.mode);
	const isBeginner = mode === "beginner";
	const uiModeForPanels: UiModeForPanels = isBeginner ? "beginner" : "normal";

	const initForTask = useCommandBuilderStore((s) => s.initForTask);
	const commands = useCommandBuilderStore((s) => s.commands);
	const selectedId = useCommandBuilderStore((s) => s.selectedId);

	const add = useCommandBuilderStore((s) => s.add);
	const remove = useCommandBuilderStore((s) => s.remove);
	const select = useCommandBuilderStore((s) => s.select);
	const openEditor = useCommandBuilderStore((s) => s.openEditor);
	const move = useCommandBuilderStore((s) => s.move);
	const runnerIo = useCommandBuilderStore((s) => s.runnerIo);

	React.useEffect(() => {
		if (!task.id) return;
		initForTask(task.id);
	}, [task.id, initForTask]);

	// Step UI state (PipelinePanel 用)
	const [selectedIndex, setSelectedIndex] = React.useState(-1);
	const [revealIndex, setRevealIndex] = React.useState(0);

	React.useEffect(() => {
		const idx = commands.findIndex((c) => c.id === selectedId);
		setSelectedIndex(idx);
		setRevealIndex((v) => (idx >= 0 ? Math.max(v, idx) : v));
	}, [commands, selectedId]);

	const onReorder = React.useCallback(
		(fromIndex: number, toIndex: number) => {
			move(fromIndex, toIndex);
		},
		[move],
	);

	const onStepPlus = React.useCallback(() => {
		setRevealIndex((v) => Math.min(v + 1, commands.length));
	}, [commands.length]);

	const onStepMinus = React.useCallback(() => {
		setRevealIndex((v) => Math.max(v - 1, 0));
	}, []);

	const onSelectNext = React.useCallback(() => {
		if (commands.length === 0) return;

		if (selectedIndex < 0) {
			select(commands[0].id);
			return;
		}

		const next = Math.min(selectedIndex + 1, commands.length - 1);
		select(commands[next].id);
	}, [commands, selectedIndex, select]);

	const onSelectStep = React.useCallback(
		(index: number) => {
			if (index < 0 || index >= commands.length) return;
			select(commands[index].id);
			setRevealIndex((v) => Math.max(v, index));
		},
		[commands, select],
	);

	// 表示用: パイプライン1行（Domainの真実ではなくUIの見せ方）
	const pipelineText = React.useMemo(() => {
		const tokens = commands.map((c) => toCommandToken(c));
		return ["input.csv", ...tokens, "output.csv"].join(" | ");
	}, [commands]);

	const resetKey = React.useMemo(
		() => buildResetKey(commands, runnerIo),
		[commands, runnerIo],
	);

	const run = useRunToResultButton({
		taskId: task.id,
		resetKey,
		getSubmittedProgram: () =>
			useCommandBuilderStore.getState().serializeProgram(),
		getRunnerIo: () => useCommandBuilderStore.getState().runnerIo,
		userId,
		navigateTo: "/result",
		autoNavigateOnComplete: true,
	});

	const canRun =
		Boolean(task.id) && commands.length > 0 && !run.running && !run.disabled;

	const disabledReason = !task.id
		? isBeginner
			? "問題の読み込み中だよ"
			: "Loading task…"
		: commands.length === 0
			? isBeginner
				? "まずはコマンドを追加してね"
				: "Add at least one command"
			: run.running
				? isBeginner
					? "実行中…"
					: "Running…"
				: null;

	const onClear = React.useCallback(() => {
		if (!task.id) return;
		if (run.running) return;
		setSelectedIndex(-1);
		setRevealIndex(0);

		// storeの「確実に存在する」APIだけで初期化する
		initForTask(task.id);
	}, [initForTask, run.running, task.id]);

	return (
		<div className="space-y-4">
			<header className="rounded border p-4">
				<div className="text-lg font-semibold">{task.title}</div>
				{task.description ? (
					<div className="mt-1 whitespace-pre-wrap text-sm opacity-80">
						{task.description}
					</div>
				) : null}
			</header>

			<CommandPalette onAdd={add} uiMode={uiModeForPanels} />

			{/* コマンド列（編集UI） */}
			{commands.length > 0 ? (
				<CommandList
					commands={commands}
					selectedId={selectedId}
					onSelect={(id) => select(id)}
					onEdit={(id) => openEditor(id)}
					onRemove={(id) => remove(id)}
					onReorder={onReorder}
					layout={isBeginner ? "horizontal" : "vertical"}
				/>
			) : (
				<div className="rounded border p-4 text-sm opacity-70">
					{isBeginner ? "コマンドを追加してね" : "Add commands"}
				</div>
			)}

			{/* P0: 初心者モードでも “Clear / Run” を常時表示して導線を切らない */}
			<section className="rounded border p-4">
				<div className="mb-2 text-xs font-semibold opacity-70">
					{isBeginner ? "コマンドライン" : "Command line"}
				</div>

				<div className="rounded border px-3 py-2 font-mono text-sm overflow-x-auto whitespace-nowrap">
					{pipelineText}
				</div>

				<div className="mt-3 flex items-center justify-between gap-3">
					<div className="text-sm font-semibold">
						{isBeginner ? "実行" : "Run"}
					</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							className="rounded border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
							onClick={onClear}
							disabled={!task.id || run.running}
						>
							{isBeginner ? "クリア" : "Clear"}
						</button>

						<button
							type="button"
							className="rounded border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
							onClick={run.onClick}
							disabled={!canRun}
						>
							{run.running
								? isBeginner
									? "うごかしてる…"
									: "Running…"
								: isBeginner
									? "ためす"
									: "Run"}
						</button>
					</div>
				</div>

				{disabledReason ? (
					<div className="mt-2 text-sm text-muted-foreground">
						{disabledReason}
					</div>
				) : null}

				{run.error ? (
					<div className="mt-2 rounded border p-3 text-sm">
						<div className="font-semibold">
							{isBeginner ? "実行に失敗" : "Run failed"}
						</div>
						<div className="mt-1 whitespace-pre-wrap opacity-80">
							{run.error}
						</div>
					</div>
				) : null}
			</section>

			{/* 上級者モードのみ: ステップ操作などの補助UI */}
			{!isBeginner && commands.length > 0 ? (
				<PipelinePanel
					uiMode={uiModeForPanels}
					commands={commands}
					selectedId={selectedId}
					selectedIndex={selectedIndex}
					revealIndex={revealIndex}
					onStepPlus={onStepPlus}
					onStepMinus={onStepMinus}
					onSelectNext={onSelectNext}
					onSelectStep={onSelectStep}
				/>
			) : null}
		</div>
	);
}
