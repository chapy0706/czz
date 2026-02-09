// apps/user/src/lib/command-builder/CommandBuilder.tsx
"use client";

import * as React from "react";

import { CommandList } from "@/lib/command-builder/CommandList";
import { CommandPalette } from "@/lib/command-builder/CommandPalette";
import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
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

	const onReorder = React.useCallback(
		(fromIndex: number, toIndex: number) => {
			move(fromIndex, toIndex);
		},
		[move],
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
		</div>
	);
}
