// apps/user/src/lib/terminal/useRunToResultButton.ts
"use client";

import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useCommandBuilderStore } from "../command-builder/commandBuilderStore";

type RunnerIo = {
	input: string | null;
	output: string | null;
};

function isRunnerIoCorrect(io: RunnerIo): boolean {
	const inputOk = io.input?.trim() === "input.csv";
	const outputOk = io.output?.trim() === "output.csv";
	return Boolean(inputOk && outputOk);
}

export function useRunToResultButton({
	taskId,
	resetKey,
}: {
	taskId: string | null;
	resetKey: string;
}) {
	const router = useRouter();
	const mode = useUiModeStore((s) => s.mode);
	const runnerIo = useCommandBuilderStore((s) => s.runnerIo);
	const commandsLen = useCommandBuilderStore((s) => s.commands.length);

	const [running, setRunning] = React.useState(false);

	// resetKeyが変わったら“実行中”だけは落とす（UI事故防止）
	React.useEffect(() => {
		void resetKey;
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

	const onClick = React.useCallback(async () => {
		if (disabled || !taskId) return;
		try {
			setRunning(true);
			router.push(`/results/running?taskId=${encodeURIComponent(taskId)}`);
		} finally {
			// running解除は遷移先で行う想定（ここは保険）
			setRunning(false);
		}
	}, [disabled, router, taskId]);

	return { disabled, title, running, onClick };
}
