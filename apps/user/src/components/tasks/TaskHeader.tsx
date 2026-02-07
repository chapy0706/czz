// apps/user/src/components/tasks/TaskHeader.tsx
"use client";

import * as React from "react";

type TaskHeaderProps = {
	taskId: string;
};

type TaskDto = {
	title: string | null;
	description: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}

function readNullableString(v: unknown): string | null {
	return typeof v === "string" ? v : null;
}

function parseTaskDto(body: unknown): TaskDto | null {
	if (!isRecord(body)) return null;
	const task = body.task;
	if (!isRecord(task)) return null;

	return {
		title: readNullableString(task.title),
		description: readNullableString(task.description),
	};
}

export function TaskHeader(props: TaskHeaderProps) {
	const { taskId } = props;

	const [loading, setLoading] = React.useState(true);
	const [task, setTask] = React.useState<TaskDto | null>(null);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		let mounted = true;
		const ac = new AbortController();

		async function run() {
			setLoading(true);
			setError(null);

			try {
				const res = await fetch(`/api/tasks/${taskId}`, {
					method: "GET",
					credentials: "include",
					cache: "no-store",
					signal: ac.signal,
				});

				const body = (await res.json().catch(() => ({}))) as unknown;

				if (!mounted) return;

				if (!res.ok) {
					const msg =
						isRecord(body) &&
						isRecord(body.error) &&
						typeof body.error.message === "string"
							? body.error.message
							: "タスクの取得に失敗しました。";
					setError(msg);
					setTask(null);
					return;
				}

				setTask(parseTaskDto(body));
			} catch (e) {
				if (!mounted) return;
				const msg = e instanceof Error ? e.message : "Unknown error";
				setError(msg);
				setTask(null);
			} finally {
				// return しない（lint/correctness/noUnsafeFinally 対策）
				if (mounted) setLoading(false);
			}
		}

		run();
		return () => {
			mounted = false;
			ac.abort();
		};
	}, [taskId]);

	const title = (task?.title ?? "").toString().trim();
	const description = (task?.description ?? "").toString().trim();

	return (
		<div className="rounded-2xl border bg-card/40 p-4">
			{loading ? (
				<div className="space-y-2 animate-pulse">
					<div className="h-6 w-2/3 rounded bg-muted/40" />
					<div className="h-4 w-full rounded bg-muted/30" />
					<div className="h-4 w-4/5 rounded bg-muted/30" />
				</div>
			) : error ? (
				<div className="space-y-1">
					<div className="text-lg font-semibold">課題</div>
					<div className="text-sm text-destructive">{error}</div>
					<div className="mt-2 text-xs text-muted-foreground">
						うまく取得できない場合、タスクが未公開/存在しない可能性があるよ。
					</div>
				</div>
			) : (
				<div className="space-y-1">
					<div className="text-lg font-semibold">
						{title.length > 0
							? title
							: "（タイトル未設定：管理画面で入力してね）"}
					</div>
					<div className="text-sm text-muted-foreground whitespace-pre-line">
						{description.length > 0
							? description
							: "（説明未設定：この課題で何をするかを書いてね）"}
					</div>
				</div>
			)}
		</div>
	);
}
