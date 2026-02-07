// apps/user/src/lib/terminal/useRunToResultButton.ts
"use client";

import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
import { isRunnerIoCorrect } from "@/lib/command-builder/runnerIo";
import { evaluateTask } from "@/lib/terminal/evaluateClient";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { useRouter } from "next/navigation";
import * as React from "react";

const LAST_RESULT_STORAGE_KEY = "czz-terminal-last-result";

type Args = {
	taskId: string | null;
	resetKey: string;
	getSubmittedProgram: () => unknown;
	userId?: string;
	navigateTo?: string;
	autoNavigateOnComplete?: boolean;
};

export function useRunToResultButton(args: Args) {
	const {
		taskId,
		resetKey,
		getSubmittedProgram,
		userId,
		navigateTo = "/result",
		autoNavigateOnComplete = true,
	} = args;

	const router = useRouter();
	const mode = useUiModeStore((s) => s.mode);
	const runnerIo = useCommandBuilderStore((s) => s.runnerIo);
	const commandsLen = useCommandBuilderStore((s) => s.commands.length);

	const [running, setRunning] = React.useState(false);

	// resetKeyが変わったら“実行中”だけは落とす（UI事故防止）
	React.useEffect(() => {
		setRunning(false);
	}, [resetKey]);

	const ioRequired = mode !== "beginner";
	const ioOk = !ioRequired || isRunnerIoCorrect(runnerIo);

	const disabled = running || !taskId || commandsLen === 0 || !ioOk;

	const title = (() => {
		if (!taskId) return "課題が未選択";
		if (commandsLen === 0) return "コマンドが無いので実行できない";
		if (!ioOk) return "Runner I/O を選んでね（cat input.csv と >> output.csv）";
		return running ? "実行中…" : "実行する";
	})();

	const label = (() => {
		if (running) return "Running…";
		return mode === "beginner" ? "実行" : "Run";
	})();

	const onClick = React.useCallback(async () => {
		if (disabled) {
			// disabled理由が I/O なら軽く通知（UX優先で alert を最小限に）
			if (!ioOk && commandsLen > 0) {
				window.alert("Runner の両端を選んでね：cat input.csv と >> output.csv");
			}
			return;
		}

		setRunning(true);
		try {
			const submittedProgram = getSubmittedProgram();
			const result = await evaluateTask({
				taskId: taskId!,
				userId,
				submittedProgram,
			});

			try {
				localStorage.setItem(LAST_RESULT_STORAGE_KEY, JSON.stringify(result));
			} catch {
				// localStorage不可でも動作自体は継続
			}

			if (autoNavigateOnComplete) router.push(navigateTo);
		} finally {
			setRunning(false);
		}
	}, [
		disabled,
		ioOk,
		commandsLen,
		getSubmittedProgram,
		taskId,
		userId,
		router,
		navigateTo,
		autoNavigateOnComplete,
	]);

	return { onClick, disabled, label, title };
}
