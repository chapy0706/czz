// apps/admin/app/tasks/[taskId]/edit/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { adminApi } from "@/lib/adminApi";
import type { TaskDto } from "@/lib/contracts/taskContract";

export default function Page() {
	const params = useParams();
	const router = useRouter();
	const taskId = typeof params.taskId === "string" ? params.taskId : "";

	const [title, setTitle] = React.useState("");
	const [description, setDescription] = React.useState("");
	const [isPublished, setIsPublished] = React.useState(false);
	const [dsl, setDsl] = React.useState("");
	const [tests, setTests] = React.useState("");

	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [saved, setSaved] = React.useState<TaskDto | null>(null);

	React.useEffect(() => {
		let mounted = true;
		async function load() {
			setLoading(true);
			setError(null);
			const res = await adminApi<TaskDto>(`/api/admin/tasks/${taskId}`);
			if (!mounted) return;
			if (!res.ok) {
				const message = "error" in res ? res.error.message : "取得に失敗したよ";
				setError(message ?? "取得に失敗したよ");
				setLoading(false);
				return;
			}
			const task = res.data;
			setTitle(task.title);
			setDescription(task.description);
			setIsPublished(task.isPublished);
			setDsl(JSON.stringify(task.dslProgram ?? {}, null, 2));
			setTests(JSON.stringify(task.testCases ?? [], null, 2));
			setLoading(false);
		}
		if (taskId) {
			load();
		}
		return () => {
			mounted = false;
		};
	}, [taskId]);

	async function onSave(e: React.FormEvent) {
		e.preventDefault();
		setSaving(true);
		setError(null);
		setSaved(null);

		const payload = {
			title: title.trim(),
			description: description.trim(),
			dslProgram: dsl,
			testCases: tests,
			isPublished,
		};

		const res = await adminApi<TaskDto>(`/api/admin/tasks/${taskId}`, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!res.ok) {
			const message = "error" in res ? res.error.message : "保存に失敗したよ";
			setError(message ?? "保存に失敗したよ");
			setSaving(false);
			return;
		}

		setSaved(res.data);
		setSaving(false);
	}

	return (
		<main className="mx-auto max-w-3xl space-y-6 p-6">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between gap-4">
					<CardTitle>タスク編集</CardTitle>
					<Button asChild variant="secondary">
						<Link href="/tasks">一覧へ</Link>
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

					<form className="space-y-6" onSubmit={onSave}>
						<div className="space-y-2">
							<Label htmlFor="title">タイトル</Label>
							<Input
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="例: 並び替えの練習"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="desc">説明</Label>
							<Textarea
								id="desc"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="この課題で何を学べる？"
							/>
						</div>

						<div className="flex items-center gap-3">
							<Switch
								checked={isPublished}
								onCheckedChange={(v) => setIsPublished(Boolean(v))}
								aria-label={
									isPublished ? "公開をオフにする" : "公開をオンにする"
								}
							/>
							<div className="text-sm">公開</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="dsl">dslProgram (JSON)</Label>
							<Textarea
								id="dsl"
								value={dsl}
								onChange={(e) => setDsl(e.target.value)}
								className="font-mono text-xs"
								rows={10}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="tests">testCases (JSON)</Label>
							<Textarea
								id="tests"
								value={tests}
								onChange={(e) => setTests(e.target.value)}
								className="font-mono text-xs"
								rows={10}
							/>
						</div>

						<div className="flex items-center gap-3">
							<Button type="submit" disabled={saving || !taskId}>
								{saving ? "保存中..." : "保存"}
							</Button>
							<Button
								type="button"
								variant="secondary"
								onClick={() => router.refresh()}
							>
								再読み込み
							</Button>
						</div>

						{saved ? (
							<Alert>
								<AlertTitle>保存したよ</AlertTitle>
								<AlertDescription>
									updatedAt: {new Date(saved.updatedAt).toLocaleString()}
								</AlertDescription>
							</Alert>
						) : null}
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
