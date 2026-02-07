// apps/user/src/components/debug/DebugPanel.tsx
"use client";

import { debugRegistry } from "@/components/debug/debugRegistry";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import * as React from "react";

function useRegistrySnapshot() {
	return React.useSyncExternalStore(
		debugRegistry.subscribe,
		() => debugRegistry.getSnapshot(),
		() => debugRegistry.getSnapshot(),
	);
}

export function DebugPanel() {
	const pathname = usePathname();
	const params = useParams();
	const snap = useRegistrySnapshot();

	const [collapsed, setCollapsed] = React.useState(false);
	const [taskId, setTaskId] = React.useState("");
	const [resultId, setResultId] = React.useState("");

	const renderedYesNo = (name: string) =>
		snap.rendered.includes(name) ? "yes" : "no";

	return (
		<div className="fixed bottom-3 right-3 z-[2147483647] w-[360px] max-w-[92vw] rounded-xl border bg-background/95 shadow-lg backdrop-blur">
			<div className="flex items-center justify-between gap-2 border-b px-3 py-2">
				<div className="min-w-0">
					<div className="text-sm font-semibold">Debug Panel</div>
					<div className="truncate text-xs text-muted-foreground">
						{pathname}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						type="button"
						className="rounded-md border px-2 py-1 text-xs"
						onClick={() => setCollapsed((v) => !v)}
					>
						{collapsed ? "open" : "close"}
					</button>
					<button
						type="button"
						className="rounded-md border px-2 py-1 text-xs"
						onClick={() => debugRegistry.clear()}
					>
						clear
					</button>
				</div>
			</div>

			{!collapsed && (
				<div className="space-y-3 p-3 text-xs">
					<section className="space-y-1">
						<div className="font-semibold">状態</div>
						<div>
							params:{" "}
							<span className="font-mono">{JSON.stringify(params ?? {})}</span>
						</div>
					</section>

					<section className="space-y-1">
						<div className="font-semibold">直近の評価フロー</div>
						<div>
							lastRequestId:{" "}
							<span className="font-mono">
								{snap.lastEval.lastRequestId ?? "-"}
							</span>
						</div>
						<div>
							lastResultId:{" "}
							<span className="font-mono">
								{snap.lastEval.lastResultId ?? "-"}
							</span>
						</div>
						<div>
							lastStatus:{" "}
							<span className="font-mono">
								{snap.lastEval.lastStatus ?? "-"}
							</span>
						</div>
						<div>
							lastError:{" "}
							<span className="font-mono">
								{snap.lastEval.lastError ?? "-"}
							</span>
						</div>
					</section>

					<section className="space-y-1">
						<div className="font-semibold">描画診断</div>
						<div>
							PipelinePanel rendered:{" "}
							<span className="font-mono">
								{renderedYesNo("PipelinePanel")}
							</span>
						</div>
						<div>
							PseudoTerminalRunner rendered:{" "}
							<span className="font-mono">
								{renderedYesNo("PseudoTerminalRunner")}
							</span>
						</div>
						<div>
							ResultPanel rendered:{" "}
							<span className="font-mono">{renderedYesNo("ResultPanel")}</span>
						</div>
					</section>

					<section className="space-y-2">
						<div className="font-semibold">遷移リンク</div>

						<div className="flex flex-wrap gap-2">
							<Link className="rounded-md border px-2 py-1" href="/tasks">
								/tasks
							</Link>
							<Link
								className="rounded-md border px-2 py-1"
								href="/results/running"
							>
								/results/running
							</Link>
							<Link className="rounded-md border px-2 py-1" href="/result">
								/result(旧?)
							</Link>
						</div>

						<div className="grid grid-cols-1 gap-2">
							<div className="flex gap-2">
								<input
									className="w-full rounded-md border px-2 py-1 font-mono"
									placeholder="taskId"
									value={taskId}
									onChange={(e) => setTaskId(e.target.value)}
								/>
								<Link
									className="rounded-md border px-2 py-1"
									href={
										taskId ? `/tasks/${encodeURIComponent(taskId)}` : "/tasks"
									}
								>
									go
								</Link>
							</div>

							<div className="flex gap-2">
								<input
									className="w-full rounded-md border px-2 py-1 font-mono"
									placeholder="resultId"
									value={resultId}
									onChange={(e) => setResultId(e.target.value)}
								/>
								<Link
									className="rounded-md border px-2 py-1"
									href={
										resultId
											? `/results/${encodeURIComponent(resultId)}`
											: "/results/running"
									}
								>
									go
								</Link>
							</div>
						</div>
					</section>
				</div>
			)}
		</div>
	);
}
