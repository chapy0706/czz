// apps/user/app/results/running/ResultsRunningClient.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { SfxLink as Link } from "@/components/ui/SfxLink";
import { useCommandBuilderStore } from "@/lib/command-builder/commandBuilderStore";
import { getArray, isRecord } from "@/lib/shared/unknown";
import { evaluateTask } from "@/lib/terminal/evaluateClient";
import { extractResultId } from "@/lib/terminal/evaluateContract";
import { toRunnerIo } from "@/lib/terminal/runnerIo";
import { persistResult } from "@/lib/terminal/terminalStore";

export default function ResultsRunningClient() {
	const router = useRouter();
	const sp = useSearchParams();
	const taskId = sp.get("taskId") ?? "";

	const [state, setState] = React.useState<"idle" | "running" | "error">(
		"idle",
	);
	const [errText, setErrText] = React.useState<string>("");

	const ranRef = React.useRef(false);

	React.useEffect(() => {
		if (ranRef.current) return;
		ranRef.current = true;

		if (!taskId) {
			setState("error");
			setErrText("taskId が指定されていない。タスク画面から実行してね。");
			return;
		}

		const program = useCommandBuilderStore.getState().serializeProgram();
		const programRecord = isRecord(program) ? program : null;
		const commands = getArray(programRecord, "commands");

		if (!Array.isArray(commands) || commands.length === 0) {
			setState("error");
			setErrText(
				"コマンドが空だった。タスク画面でコマンドを選んでから実行してね。",
			);
			return;
		}

		setState("running");

		(async () => {
			const runnerIoPreset = useCommandBuilderStore.getState().runnerIo;
			const evaluated = await evaluateTask({
				taskId,
				submittedProgram: program,
				runnerIo: toRunnerIo(runnerIoPreset),
				purpose: "evaluate",
			});
			const extracted = extractResultId(evaluated);
			if (extracted) {
				router.replace(`/results/${extracted}`);
				return;
			}
			persistResult(evaluated, { taskId });
			router.replace("/result");
		})().catch((e) => {
			setState("error");
			setErrText(e instanceof Error ? e.message : "Unknown error");
		});
	}, [router, taskId]);

	return (
		<main
			className="mx-auto max-w-5xl px-6 py-10"
			data-testid="results-running-page"
		>
			<div className="space-y-2">
				<h1 className="text-2xl font-bold tracking-tight">判定中…</h1>
				<p className="text-sm text-muted-foreground">
					結果ページに切り替わるまで少し待ってね。
				</p>
			</div>

			{state === "running" ? (
				<div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
					running…
				</div>
			) : state === "error" ? (
				<div className="mt-6 space-y-3">
					<div
						className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground"
						data-testid="results-running-error"
					>
						{errText}
					</div>
					<div className="flex items-center gap-3 text-sm">
						<Link
							href="/tasks"
							className="text-muted-foreground hover:underline"
						>
							課題一覧へ
						</Link>
						{taskId ? (
							<Link
								href={`/tasks/${taskId}`}
								className="text-muted-foreground hover:underline"
							>
								タスクへ戻る
							</Link>
						) : null}
					</div>
				</div>
			) : null}
		</main>
	);
}
