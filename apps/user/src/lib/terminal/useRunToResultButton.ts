// apps/user/src/lib/terminal/useRunToResultButton.ts
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type MaybePromise<T> = T | Promise<T>;

type UseRunToResultButtonOptions = Readonly<{
	taskId: string;
	resetKey: string;

	/**
	 * 実行前に「最新の提出プログラム」を確定させたい場合のフック。
	 * 例: Zustandのstoreへcommitする、serializeしてスナップショットを取る、など。
	 */
	getSubmittedProgram?: () => MaybePromise<unknown>;

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
	onClick: () => Promise<void>;
}>;

export function useRunToResultButton({
	taskId,
	resetKey,
	getSubmittedProgram,
	navigateTo,
	userId,
}: UseRunToResultButtonOptions): RunToResultButtonState {
	const router = useRouter();
	const [running, setRunning] = useState(false);

	const mode = useUiModeStore((s) => s.mode);

	const to = useMemo(() => {
		const defaultTo = (id: string) => `/tasks/${id}/running`;
		const nav = navigateTo ?? defaultTo;
		return typeof nav === "string" ? nav : nav(taskId);
	}, [navigateTo, taskId]);

	const title = useMemo(() => {
		if (!userId) return "ログインして実行";
		if (running) return "実行中…";
		return mode === "beginner" ? "実行してみる" : "実行して結果へ";
	}, [mode, running, userId]);

	const label = title;

	const onClick = useCallback(async () => {
		if (running) return;
		if (!userId) return;

		setRunning(true);
		try {
			// “提出内容確定” のような副作用が必要ならここで実行
			if (getSubmittedProgram) {
				await getSubmittedProgram();
			}

			// resetKey は将来のガード（同一タスクでの再実行など）に残しておく
			void resetKey;

			router.push(to);
		} finally {
			// 成功時はページ遷移するので気にしなくていい。失敗時だけ復帰できる。
			setRunning(false);
		}
	}, [getSubmittedProgram, resetKey, router, running, to, userId]);

	return {
		disabled: running || !userId,
		running,
		title,
		label,
		onClick,
	};
}
