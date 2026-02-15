// apps/user/src/lib/terminal/useRunToResultButton.ts
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { evaluateTask } from "@/lib/terminal/evaluateClient";
import { extractResultId } from "@/lib/terminal/evaluateContract";
import {
	type RunnerIo,
	type RunnerIoPreset,
	toRunnerIo,
} from "@/lib/terminal/runnerIo";
import { persistResult } from "@/lib/terminal/terminalStore";
import { tTerminal } from "@/lib/terminal/terminalStrings";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type MaybePromise<T> = T | Promise<T>;

type UseRunToResultButtonOptions = Readonly<{
	taskId: string | null;
	resetKey: string;

	/**
	 * 実行前に「最新の提出プログラム」を確定させたい場合のフック。
	 * 例: Zustandのstoreへcommitする、serializeしてスナップショットを取る、など。
	 */
	getSubmittedProgram?: () => MaybePromise<unknown>;
	getRunnerIo?: () => RunnerIoPreset | RunnerIo | null;

	/**
	 * 遷移先を差し替えたい場合に使う。
	 * 例: "/tasks/:id/result" / "/result?taskId=..." など。
	 */
	navigateTo?: string | ((taskId: string) => string);

	/**
	 * ユーザー状態でボタンの挙動を変えたいとき用（未ログインで無効化等）。
	 * 使わないなら渡さなくてOK。
	 */
	userId?: string | null;

	/**
	 * 将来の拡張用（現状は navigate のみ）。
	 */
	autoNavigateOnComplete?: boolean;
}>;

type RunToResultButtonState = Readonly<{
	disabled: boolean;
	running: boolean;
	title: string;
	label: string;
	error: string | null;
	onClick: () => Promise<void>;
}>;

function normalizeRunnerIo(
	value: RunnerIoPreset | RunnerIo | null | undefined,
) {
	if (!value) return { input: null, output: null } satisfies RunnerIo;
	if ("input" in value && "output" in value) {
		const maybePreset = value as RunnerIoPreset;
		if (
			typeof maybePreset.input === "string" &&
			typeof maybePreset.output === "string"
		) {
			return toRunnerIo(maybePreset);
		}
		return value as RunnerIo;
	}
	return { input: null, output: null } satisfies RunnerIo;
}

function isRunnerIoUnset(io: RunnerIo): boolean {
	return !io.input && !io.output;
}

export function useRunToResultButton({
	taskId,
	resetKey: _resetKey,
	getSubmittedProgram,
	getRunnerIo,
	navigateTo,
	userId,
	autoNavigateOnComplete,
}: UseRunToResultButtonOptions): RunToResultButtonState {
	const router = useRouter();
	const [running, setRunning] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const mode = useUiModeStore((s) => s.mode);
	const isBeginner = mode === "beginner";

	const to = useMemo(() => {
		const nav = navigateTo ?? "/result";
		return typeof nav === "string" ? nav : taskId ? nav(taskId) : nav("");
	}, [navigateTo, taskId]);

	const title = useMemo(() => {
		if (!taskId) return "タスクが見つからない";
		if (running) return "実行中…";
		return mode === "beginner" ? "実行してみる" : "実行して結果へ";
	}, [mode, running, taskId]);

	const label = title;

	const onClick = useCallback(async () => {
		if (running) return;
		if (!taskId) return;

		setError(null);
		setRunning(true);
		try {
			const submittedProgram = getSubmittedProgram
				? await getSubmittedProgram()
				: undefined;
			let runnerIo = normalizeRunnerIo(getRunnerIo?.());
			if (isBeginner && isRunnerIoUnset(runnerIo)) {
				runnerIo = toRunnerIo({
					input: "cat_input_csv",
					output: "append_output_csv",
				});
			}

			const evaluated = await evaluateTask({
				taskId,
				userId: userId ?? undefined,
				submittedProgram,
				runnerIo,
				purpose: "evaluate",
			});

			const resultId = extractResultId(evaluated);
			if (resultId) {
				if (autoNavigateOnComplete !== false) {
					router.push(`/results/${resultId}`);
				}
				return;
			}

			persistResult(evaluated, { taskId });
			if (autoNavigateOnComplete !== false) {
				router.push(to);
			}
		} catch (e) {
			const mode = useUiModeStore.getState().mode;
			setError(
				e instanceof Error ? e.message : tTerminal("unknownError", mode),
			);
		} finally {
			// 成功時はページ遷移するので気にしなくていい。失敗時だけ復帰できる。
			setRunning(false);
		}
	}, [
		autoNavigateOnComplete,
		getRunnerIo,
		getSubmittedProgram,
		router,
		running,
		taskId,
		to,
		userId,
		isBeginner,
	]);

	return {
		disabled: running || !taskId,
		running,
		title,
		label,
		error,
		onClick,
	};
}
