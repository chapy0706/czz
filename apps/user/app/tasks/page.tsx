// apps/user/app/tasks/page.tsx
"use client";

import useSwr from "swr";
import { BeginnerIndicatingMascot } from "@/components/beginner/beginner-indicating-mascot";
import { SfxLink as Link } from "@/components/ui/SfxLink";
import { getArray, isRecord } from "@/lib/shared/unknown";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { cn } from "@/lib/utils";

type AnyTask = {
	id: string | number;
	title?: string;
	description?: string;
};

const fetcher = async (url: string) => {
	const res = await fetch(url, { method: "GET" });
	if (!res.ok) {
		const text = await res.text().catch(() => "");
		throw new Error(`Failed to fetch: ${res.status} ${text}`);
	}
	return res.json();
};

function normalizeTasks(data: unknown): AnyTask[] {
	if (Array.isArray(data)) {
		return data.filter(isRecord) as AnyTask[];
	}
	if (!isRecord(data)) return [];
	const arr =
		getArray(data, "tasks") ??
		getArray(data, "items") ??
		getArray(data, "data") ??
		[];
	return arr.filter(isRecord) as AnyTask[];
}

export default function TasksPage() {
	const mode = useUiModeStore((s) => s.mode);
	const isBeginner = mode === "beginner";

	const { data, error, isLoading } = useSwr("/api/tasks", fetcher);
	const tasks = normalizeTasks(data);

	const content = isLoading ? (
		<div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
			読み込み中…
		</div>
	) : error ? (
		<div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
			課題の取得に失敗した。DB起動や seed 状態を確認してね。
		</div>
	) : tasks.length === 0 ? (
		<div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
			公開済みの課題が見つからない。管理画面 or seed を確認してね。
		</div>
	) : (
		<ul className="grid gap-3 sm:grid-cols-2">
			{tasks.map((t) => (
				<li
					key={String(t.id)}
					className="rounded border bg-background p-4"
					data-testid="task-card"
				>
					<div className="flex items-start justify-between gap-3">
						<div className="space-y-1">
							<div className="text-sm font-semibold">
								{t.title ?? `Task ${t.id}`}
							</div>
							{t.description ? (
								<p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
									{t.description}
								</p>
							) : (
								<p className="text-xs text-muted-foreground">
									(no description)
								</p>
							)}
						</div>

						<Link
							href={`/tasks/${t.id}`}
							className="shrink-0 rounded border bg-accent px-3 py-2 text-xs hover:opacity-90"
							data-testid="task-open"
						>
							開く
						</Link>
					</div>
				</li>
			))}
		</ul>
	);

	return (
		<main
			className={cn(
				"mx-auto max-w-5xl px-6 py-10",
				// 初心者モード時の固定UI（HUD/キャラ）が下に被るので、下余白を確保してタップ可能域を守る
				isBeginner && "pb-[calc(240px+env(safe-area-inset-bottom))] md:pb-10",
			)}
			data-testid="tasks-page"
		>
			{/* AuthUserBadge が右上固定なので、ページ側の「TOPへ」は右上に置かない（干渉回避） */}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight">課題一覧</h1>
					<p className="text-sm text-muted-foreground">
						1つ選んで、コマンドを組み立てて実行しよう。
					</p>
				</div>

				<Link
					href="/"
					className={cn(
						"text-sm text-muted-foreground hover:underline",
						"self-start sm:self-auto",
						// モバイルは“右上”に行かないように軽く位置をずらす
						"sm:mt-0 mt-1",
					)}
					data-testid="tasks-back-top"
				>
					TOPへ
				</Link>
			</div>

			{/* 右側の余白（md+）にだけ案内キャラ。モバイルは余白が無いので出さない */}
			<div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
				<div className="min-w-0 flex-1">{content}</div>

				<aside className="hidden w-[200px] md:block">
					<BeginnerIndicatingMascot
						className="sticky top-24 pointer-events-none opacity-90"
						size={180}
					/>
				</aside>
			</div>
		</main>
	);
}
