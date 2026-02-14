// apps/admin/app/tasks/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/adminApi";
import type { TaskDto } from "@/lib/contracts/taskContract";

export default function Page() {
	const [tasks, setTasks] = React.useState<TaskDto[]>([]);
	const [error, setError] = React.useState<string | null>(null);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		let mounted = true;
		async function load() {
			setLoading(true);
			setError(null);
			const res = await adminApi<TaskDto[]>("/api/admin/tasks");
			if (!mounted) return;
			if (!res.ok) {
				const message = "error" in res ? res.error.message : "取得に失敗したよ";
				setError(message ?? "取得に失敗したよ");
				setLoading(false);
				return;
			}
			setTasks(res.data);
			setLoading(false);
		}
		load();
		return () => {
			mounted = false;
		};
	}, []);

	return (
		<main className="mx-auto max-w-5xl space-y-6 p-6">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between gap-4">
					<CardTitle>Tasks</CardTitle>
					<Button asChild>
						<Link href="/tasks/new">新規作成</Link>
					</Button>
				</CardHeader>
				<CardContent>
					{loading ? <div className="text-sm">読み込み中...</div> : null}
					{error ? (
						<Alert variant="destructive" className="mb-4">
							<AlertTitle>エラー</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					) : null}

					<div className="rounded border">
						<div className="grid grid-cols-[1fr_120px_200px_120px] gap-3 border-b bg-muted/40 px-3 py-2 text-xs font-semibold">
							<div>Title</div>
							<div>公開</div>
							<div>Updated</div>
							<div>操作</div>
						</div>
						{tasks.length === 0 && !loading ? (
							<div className="px-3 py-4 text-sm opacity-70">
								タスクがありません。
							</div>
						) : null}
						{tasks.map((task) => (
							<div
								key={task.id}
								className="grid grid-cols-[1fr_120px_200px_120px] gap-3 border-b px-3 py-2 text-sm last:border-b-0"
							>
								<div className="truncate">{task.title}</div>
								<div>{task.isPublished ? "公開" : "非公開"}</div>
								<div>{new Date(task.updatedAt).toLocaleString()}</div>
								<div>
									<Button asChild size="sm" variant="secondary">
										<Link href={`/tasks/${task.id}/edit`}>編集</Link>
									</Button>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
