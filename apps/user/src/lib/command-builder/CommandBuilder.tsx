// apps/user/src/lib/command-builder/CommandBuilder.tsx
"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { CommandList } from "@/lib/command-builder/CommandList";
import { CommandPalette } from "@/lib/command-builder/CommandPalette";
import { PipelinePanel } from "@/lib/command-builder/PipelinePanel";
import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
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

type EvaluateResponse = {
	ok: boolean;
	value?: { resultId?: string; id?: string; result?: { id?: string } };
	resultId?: string;
	message?: string;
	error?: { kind?: string };
};

function asMessage(e: unknown): string {
	if (!e) return "Unknown error";
	if (typeof e === "string") return e;
	if (e instanceof Error) return e.message || "Error";
	try {
		return JSON.stringify(e);
	} catch {
		return String(e);
	}
}

async function postEvaluate(args: {
	taskId: string;
	userId?: string;
	program: unknown;
}): Promise<{ resultId?: string }> {
	const res = await fetch(`/api/tasks/${args.taskId}/evaluate`, {
		method: "POST",
		cache: "no-store",
		credentials: "same-origin",
		headers: { "content-type": "application/json" },
		// サーバ側の契約差分に備えて冗長に送る（P0: とにかく導線を繋ぐ）
		body: JSON.stringify({
			dslProgram: args.program,
			program: args.program,
			userId: args.userId,
		}),
	});

	const text = await res.text().catch(() => "");
	const json: EvaluateResponse | null = text ? (JSON.parse(text) as any) : null;

	if (!res.ok) {
		const msg =
			typeof json?.message === "string"
				? json.message
				: typeof json?.error?.kind === "string"
					? json.error.kind
					: text
						? text.slice(0, 200)
						: `HTTP ${res.status}`;
		throw new Error(msg);
	}

	if (json?.ok !== true) {
		const msg =
			typeof json?.message === "string"
				? json.message
				: typeof json?.error?.kind === "string"
					? json.error.kind
					: "Evaluate response not ok";
		throw new Error(msg);
	}

	const resultId =
		(typeof json?.value?.resultId === "string" && json.value.resultId) ||
		(typeof json?.value?.id === "string" && json.value.id) ||
		(typeof json?.resultId === "string" && json.resultId) ||
		(typeof json?.value?.result?.id === "string" && json.value.result.id) ||
		undefined;

	return { resultId: resultId || undefined };
}

function toCommandToken(command: unknown): string {
	// command は store の Draft なので、型を信用せずに "それっぽい" 文字列へ安全に落とす
	const c: any = command;

	const v = c?.value;
	const t1 =
		v && typeof v === "object" && typeof v.type === "string"
			? v.type
			: undefined;
	const t2 = typeof c?.type === "string" ? c.type : undefined;

	const t = t1 ?? t2 ?? "CMD";
	return String(t);
}

export function CommandBuilder(props: Props) {
	const { task, userId } = props;

	const router = useRouter();

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

	React.useEffect(() => {
		if (!task.id) return;
		initForTask(task.id);
	}, [task.id, initForTask]);

	// Step UI state (PipelinePanel 用)
	const [selectedIndex, setSelectedIndex] = React.useState(-1);
	const [revealIndex, setRevealIndex] = React.useState(0);

	React.useEffect(() => {
		const idx = commands.findIndex((c: any) => c.id === selectedId);
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
			select((commands[0] as any).id);
			return;
		}

		const next = Math.min(selectedIndex + 1, commands.length - 1);
		select((commands[next] as any).id);
	}, [commands, selectedIndex, select]);

	const onSelectStep = React.useCallback(
		(index: number) => {
			if (index < 0 || index >= commands.length) return;
			select((commands[index] as any).id);
			setRevealIndex((v) => Math.max(v, index));
		},
		[commands, select],
	);

	// 表示用: パイプライン1行（Domainの真実ではなくUIの見せ方）
	const pipelineText = React.useMemo(() => {
		const tokens = commands.map((c: any) => toCommandToken(c));
		return ["input.csv", ...tokens, "output.csv"].join(" | ");
	}, [commands]);

	const [isRunning, setIsRunning] = React.useState(false);
	const [runError, setRunError] = React.useState<string | null>(null);

	const canRun = Boolean(task.id) && commands.length > 0 && !isRunning;

	const disabledReason = !task.id
		? isBeginner
			? "問題の読み込み中だよ"
			: "Loading task…"
		: commands.length === 0
			? isBeginner
				? "まずはコマンドを追加してね"
				: "Add at least one command"
			: isRunning
				? isBeginner
					? "実行中…"
					: "Running…"
				: null;

	const onClear = React.useCallback(() => {
		if (!task.id) return;
		if (isRunning) return;

		setRunError(null);
		setSelectedIndex(-1);
		setRevealIndex(0);

		// storeの「確実に存在する」APIだけで初期化する
		initForTask(task.id);
	}, [initForTask, isRunning, task.id]);

	const onRun = React.useCallback(async () => {
		if (!task.id) return;

		setIsRunning(true);
		setRunError(null);

		try {
			const program = useCommandBuilderStore.getState().serializeProgram();
			const { resultId } = await postEvaluate({
				taskId: task.id,
				userId,
				program,
			});

			// P0: resultId が取れたら直リンク、取れなければ旧 /result へフォールバック。
			if (typeof resultId === "string" && resultId) {
				router.push(`/results/${resultId}`);
			} else {
				router.push("/result");
			}
		} catch (e) {
			setRunError(asMessage(e));
		} finally {
			setIsRunning(false);
		}
	}, [router, task.id, userId]);

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
					commands={commands as any}
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
							disabled={!task.id || isRunning}
						>
							{isBeginner ? "クリア" : "Clear"}
						</button>

						<button
							type="button"
							className="rounded border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
							onClick={onRun}
							disabled={!canRun}
						>
							{isRunning
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

				{runError ? (
					<div className="mt-2 rounded border p-3 text-sm">
						<div className="font-semibold">
							{isBeginner ? "実行に失敗" : "Run failed"}
						</div>
						<div className="mt-1 whitespace-pre-wrap opacity-80">
							{runError}
						</div>
					</div>
				) : null}
			</section>

			{/* 上級者モードのみ: ステップ操作などの補助UI */}
			{!isBeginner && commands.length > 0 ? (
				<PipelinePanel
					uiMode={uiModeForPanels}
					commands={commands as any}
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
