// apps/user/src/lib/command-builder/CommandBuilder.tsx
"use client";

import * as React from "react";

import { CommandEditorSheet } from "@/lib/command-builder/CommandEditorSheet";
import { CommandList } from "@/lib/command-builder/CommandList";
import { CommandPalette } from "@/lib/command-builder/CommandPalette";
import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
import {
	type CommandType,
	getCatalogItem,
	isCommandType,
} from "@/lib/command-builder/commandCatalog";
import { buildResetKey } from "@/lib/command-builder/serialize";
import { getString, isRecord } from "@/lib/shared/unknown";
import { PseudoTerminalRunner } from "@/lib/terminal/PseudoTerminalRunner";
import {
	RUNNER_INPUT_PRESETS,
	RUNNER_OUTPUT_PRESETS,
	type RunnerInputPreset,
	type RunnerOutputPreset,
	runnerInputCmd,
	runnerOutputCmd,
} from "@/lib/terminal/runnerIo";
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

function resolveCommandType(command: unknown): CommandType | null {
	// command は store の Draft なので、型を信用せずに "それっぽい" 文字列へ安全に落とす
	const c = isRecord(command) ? command : null;
	const v = isRecord(c?.value) ? c?.value : null;
	const t1 = getString(v, "type");
	const t2 = getString(c, "type");
	const t = t1 ?? t2 ?? null;
	if (!t) return null;
	return isCommandType(t) ? t : null;
}

function toCommandToken(
	command: unknown,
	mode: "beginner" | "advanced",
): string {
	const c = isRecord(command) ? command : null;
	const v = isRecord(c?.value) ? c?.value : null;
	const t1 = getString(v, "type");
	const t2 = getString(c, "type");
	const t = t1 ?? t2 ?? "CMD";
	const type = resolveCommandType(command);
	if (!type) return String(t);
	const item = getCatalogItem(type);
	if (!item) return String(t);
	return mode === "beginner"
		? (item.ui.beginnerLabel ?? item.label ?? String(t))
		: (item.label ?? String(t));
}

function runnerInputDisplay(
	preset: RunnerInputPreset | null | undefined,
	mode: "beginner" | "advanced",
): string {
	if (mode !== "beginner") return runnerInputCmd(preset);
	return preset === "cat_input_csv" ? "入力データ" : "入力未設定";
}

function runnerOutputDisplay(
	preset: RunnerOutputPreset | null | undefined,
	mode: "beginner" | "advanced",
): string {
	if (mode !== "beginner") return runnerOutputCmd(preset);
	switch (preset) {
		case "append_output_csv":
			return "出力データ（追記）";
		default:
			return "出力未設定";
	}
}

function runnerInputOptionLabel(
	preset: RunnerInputPreset,
	mode: "beginner" | "advanced",
): string {
	if (mode !== "beginner") return runnerInputCmd(preset);
	switch (preset) {
		case "cat_input_csv":
			return "入力データ";
		default:
			return "未選択";
	}
}

function runnerOutputOptionLabel(
	preset: RunnerOutputPreset,
	mode: "beginner" | "advanced",
): string {
	if (mode !== "beginner") return runnerOutputCmd(preset);
	switch (preset) {
		case "append_output_csv":
			return "出力データ（追記）";
		default:
			return "未選択";
	}
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
	const editingId = useCommandBuilderStore((s) => s.editingId);

	const add = useCommandBuilderStore((s) => s.add);
	const remove = useCommandBuilderStore((s) => s.remove);
	const select = useCommandBuilderStore((s) => s.select);
	const openEditor = useCommandBuilderStore((s) => s.openEditor);
	const closeEditor = useCommandBuilderStore((s) => s.closeEditor);
	const updateCommandJson = useCommandBuilderStore((s) => s.updateCommandJson);
	const move = useCommandBuilderStore((s) => s.move);
	const runnerIo = useCommandBuilderStore((s) => s.runnerIo);
	const setRunnerInput = useCommandBuilderStore((s) => s.setRunnerInput);
	const setRunnerOutput = useCommandBuilderStore((s) => s.setRunnerOutput);

	React.useEffect(() => {
		if (!task.id) return;
		initForTask(task.id);
	}, [task.id, initForTask]);

	const onReorder = React.useCallback(
		(fromIndex: number, toIndex: number) => {
			move(fromIndex, toIndex);
		},
		[move],
	);

	// 表示用: パイプライン1行（Domainの真実ではなくUIの見せ方）
	const pipelineText = React.useMemo(() => {
		const left = runnerInputDisplay(runnerIo.input, mode);
		const right = runnerOutputDisplay(runnerIo.output, mode);
		const tokens = commands.map((c) => toCommandToken(c, mode)).join(" | ");
		const mid = tokens || "未選択";
		return `${left} | ${mid} ${right}`;
	}, [commands, mode, runnerIo]);

	const editingCommand = React.useMemo(() => {
		if (!editingId) return null;
		return commands.find((c) => c.id === editingId) ?? null;
	}, [commands, editingId]);

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
		? "問題を読み込み中…"
		: commands.length === 0
			? "まずはコマンドを追加してね"
			: run.running
				? "実行中…"
				: null;

	const onClear = React.useCallback(() => {
		if (!task.id) return;
		if (run.running) return;

		// storeの「確実に存在する」APIだけで初期化する
		initForTask(task.id);
	}, [initForTask, run.running, task.id]);

	return (
		<div className="space-y-4">
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
					コマンドを追加してね
				</div>
			)}

			{/* P0: 初心者モードでも “Clear / Run” を常時表示して導線を切らない */}
			<section className="rounded border p-4">
				<div className="mb-2 text-xs font-semibold opacity-70">
					コマンドライン
				</div>

				<div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
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
									{runnerInputOptionLabel(p, mode)}
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
									{runnerOutputOptionLabel(p, mode)}
								</option>
							))}
						</select>
					</label>
				</div>

				<div className="rounded border px-3 py-2 font-mono text-sm overflow-x-auto whitespace-nowrap">
					{pipelineText}
				</div>

				<div className="mt-3 flex items-center justify-between gap-3">
					<div className="text-sm font-semibold">実行</div>

					<div className="flex items-center gap-2">
						<button
							type="button"
							className="rounded border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
							onClick={onClear}
							disabled={!task.id || run.running}
						>
							クリア
						</button>

						<button
							type="button"
							className="rounded border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
							onClick={run.onClick}
							disabled={!canRun}
						>
							{run.running ? "うごかしてる…" : "ためす"}
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
						<div className="font-semibold">実行に失敗しました</div>
						<div className="mt-1 whitespace-pre-wrap opacity-80">
							{run.error}
						</div>
					</div>
				) : null}
			</section>

			<PseudoTerminalRunner
				taskId={task.id}
				getSubmittedProgram={() =>
					useCommandBuilderStore.getState().serializeProgram()
				}
			/>

			{editingCommand ? (
				<CommandEditorSheet
					selected={editingCommand}
					onClose={closeEditor}
					onSave={(nextValue) => {
						updateCommandJson(editingCommand.id, nextValue);
						closeEditor();
					}}
				/>
			) : null}
		</div>
	);
}
