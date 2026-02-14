// apps/admin/app/page.tsx

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
	return (
		<main className="mx-auto max-w-5xl space-y-6 p-6">
			<Card>
				<CardHeader>
					<CardTitle>Admin Console</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm opacity-70">
						タスク管理とメトリクスの入口。必要最小限から始める。
					</p>
					<div className="flex flex-wrap gap-3">
						<Button asChild>
							<Link href="/tasks">Tasks 一覧</Link>
						</Button>
						<Button asChild variant="secondary">
							<Link href="/tasks/new">Tasks 新規作成</Link>
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Metrics (Coming Soon)</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-3">
					<div className="rounded border p-4 text-sm opacity-70">DAU / MAU</div>
					<div className="rounded border p-4 text-sm opacity-70">完了率</div>
					<div className="rounded border p-4 text-sm opacity-70">
						平均試行回数
					</div>
				</CardContent>
			</Card>
		</main>
	);
}
