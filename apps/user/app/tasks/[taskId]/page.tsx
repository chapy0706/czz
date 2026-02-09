// apps/user/app/tasks/[taskId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CommandBuilder } from "@/lib/command-builder/CommandBuilder";
import { getString, isRecord } from "@/lib/shared/unknown";
import { getOrCreateGuestUserId } from "@/lib/terminal/guestUserId";

type TaskMeta = {
	id: string;
	title: string;
	description: string;
};

function coerceTaskMeta(raw: unknown): TaskMeta {
	if (!raw || typeof raw !== "object") {
		throw new Error("課題データがオブジェクトではありません");
	}
	const r = isRecord(raw) ? raw : null;
	if (!r) {
		throw new Error("課題データの形式が不正です");
	}

	const id = getString(r, "id") ?? "";
	const title = getString(r, "title");
	const description = getString(r, "description");

	if (!id) {
		throw new Error(
			`課題データに id がありません。keys=${Object.keys(r).join(",")}`,
		);
	}
	if (title === undefined) {
		throw new Error(
			`課題データに title がありません。keys=${Object.keys(r).join(",")}`,
		);
	}
	if (description === undefined) {
		throw new Error(
			`課題データに description がありません。keys=${Object.keys(r).join(",")}`,
		);
	}

	return { id, title, description };
}

async function fetchTaskMeta(taskId: string): Promise<TaskMeta> {
	const res = await fetch(`/api/tasks/${taskId}`, {
		cache: "no-store",
		credentials: "same-origin",
	});

	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(
			`課題の取得に失敗しました: ${res.status}${text ? ` (${text.slice(0, 120)})` : ""}`,
		);
	}

	const json: unknown = await res.json().catch(() => null);

	if (!isRecord(json)) {
		throw new Error("課題のレスポンス形式が不正です");
	}
	if (json.ok !== true) {
		const err = isRecord(json.error) ? json.error : null;
		const msg =
			getString(json, "message") ??
			getString(err, "kind") ??
			"課題の取得に失敗しました";
		throw new Error(msg);
	}

	// 想定: { ok:true, value:{...} }
	// でも実装差分があっても壊れないように吸収
	const payload = isRecord(json.value)
		? json.value
		: isRecord(json.task)
			? json.task
			: isRecord(json.value) && isRecord(json.value.task)
				? json.value.task
				: (json.value ?? null);

	return coerceTaskMeta(payload);
}

export default function TaskPage() {
	const params = useParams();
	const taskId = (() => {
		if (!params || !isRecord(params)) return undefined;
		const raw = params.taskId;
		return Array.isArray(raw) ? raw[0] : raw;
	})();

	if (!taskId) {
		return (
			<div className="mx-auto w-full max-w-5xl px-4 py-6">
				<div className="rounded-2xl border bg-card p-4">
					<div className="text-sm text-muted-foreground">課題</div>
					<div className="mt-2 text-sm">
						ルートのパラメータが不正です（taskId が見つかりません）
					</div>
				</div>
			</div>
		);
	}

	return <TaskPageClient taskId={taskId} />;
}

function TaskPageClient({ taskId }: { taskId: string }) {
	const [meta, setMeta] = useState<TaskMeta | null>(null);
	const [error, setError] = useState<string | null>(null);

	const userId = useMemo(() => getOrCreateGuestUserId(), []);

	useEffect(() => {
		let alive = true;
		setMeta(null);
		setError(null);

		fetchTaskMeta(taskId)
			.then((m) => {
				if (!alive) return;
				setMeta(m);
			})
			.catch((e) => {
				if (!alive) return;
				setError(String(e?.message ?? e));
			});

		return () => {
			alive = false;
		};
	}, [taskId]);

	const taskForBuilder = useMemo(
		() => ({
			id: meta?.id ?? taskId,
			title: meta?.title ?? "読み込み中…",
			description: meta?.description ?? "読み込み中…",
			// 公開/非公開の情報はここでは使わないので固定でOK（必要ならAPIレスポンスに寄せる）
			isPublished: true,
		}),
		[meta, taskId],
	);

	return (
		<div className="mx-auto w-full max-w-5xl px-4 py-6">
			<div className="mb-4 rounded-2xl border bg-card p-4">
				<div className="text-sm text-muted-foreground">もんだい</div>

				<div className="text-xl font-semibold">
					{error ? "読み込みに失敗しました" : (meta?.title ?? "読み込み中…")}
				</div>

				<div className="mt-2 text-sm text-muted-foreground">
					{error
						? `問題文の取得に失敗: ${error}`
						: (meta?.description ?? "読み込み中…")}
				</div>
			</div>

			{/* CommandBuilder は taskId ではなく task を受け取る契約 */}
			<CommandBuilder task={taskForBuilder} userId={userId} />
		</div>
	);
}
