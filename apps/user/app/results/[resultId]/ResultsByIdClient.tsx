// apps/user/app/results/[resultId]/ResultsByIdClient.tsx
"use client";

import Link from "next/link";
import * as React from "react";

type Props = {
	resultId: string;
};

type ApiOk = {
	ok: true;
	resultId: string;
	passed?: number;
	total?: number;
	output?: unknown;
	taskId?: string;
	createdAt?: string;
};

type ApiErr = {
	ok: false;
	error: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}

function normalizeApiResponse(json: unknown): ApiOk | ApiErr {
	if (!isRecord(json)) return { ok: false, error: "Invalid JSON shape" };
	if (json.ok === true) return json as ApiOk;
	if (json.ok === false && typeof json.error === "string")
		return json as ApiErr;
	return { ok: false, error: "Unexpected response" };
}

export default function ResultsByIdClient({ resultId }: Props) {
	const [state, setState] = React.useState<
		| { status: "loading" }
		| { status: "error"; message: string }
		| { status: "unauthorized" }
		| { status: "notfound" }
		| { status: "ok"; data: ApiOk }
	>({ status: "loading" });

	React.useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				// 想定API: /api/results/:resultId
				// もし実装が別なら、ここを合わせるのが最小修正。
				const res = await fetch(
					`/api/results/${encodeURIComponent(resultId)}`,
					{
						method: "GET",
						cache: "no-store",
					},
				);

				if (!res.ok) {
					if (res.status === 401) {
						setState({ status: "unauthorized" });
						return;
					}
					if (res.status === 403 || res.status === 404) {
						setState({ status: "notfound" });
						return;
					}
					const text = await res.text().catch(() => "");
					throw new Error(
						`API returned ${res.status}. /api/results/${resultId} ${text ? `- ${text}` : ""}`,
					);
				}

				const json = (await res.json()) as unknown;
				const normalized = normalizeApiResponse(json);

				if (cancelled) return;

				if (normalized.ok) {
					setState({ status: "ok", data: normalized });
				} else {
					const message =
						"error" in normalized ? normalized.error : "Unexpected response";
					setState({ status: "error", message });
				}
			} catch (e) {
				if (cancelled) return;
				setState({
					status: "error",
					message: e instanceof Error ? e.message : "Unknown error",
				});
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [resultId]);

	return (
		<main
			className="mx-auto max-w-5xl px-6 py-10"
			data-testid="results-by-id-page"
		>
			<div className="space-y-2">
				<h1 className="text-2xl font-bold tracking-tight">実行結果</h1>
				<p className="text-sm text-muted-foreground">
					Result ID: <span className="font-mono">{resultId}</span>
				</p>
			</div>

			{state.status === "loading" ? (
				<div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
					loading…
				</div>
			) : state.status === "unauthorized" ? (
				<div className="mt-6 space-y-3">
					<div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
						ログインが必要です。
					</div>
					<div className="flex flex-wrap items-center gap-3 text-sm">
						<Link
							className="text-muted-foreground hover:underline"
							href="/sign-in"
						>
							ログインへ
						</Link>
					</div>
				</div>
			) : state.status === "notfound" ? (
				<div className="mt-6 space-y-3">
					<div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
						結果が見つかりません。
					</div>
					<div className="flex flex-wrap items-center gap-3 text-sm">
						<Link
							className="text-muted-foreground hover:underline"
							href="/tasks"
						>
							課題一覧へ
						</Link>
					</div>
				</div>
			) : state.status === "error" ? (
				<div className="mt-6 space-y-3">
					<div className="rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
						結果の取得に失敗した。{state.message}
					</div>
					<div className="flex flex-wrap items-center gap-3 text-sm">
						<Link
							className="text-muted-foreground hover:underline"
							href="/tasks"
						>
							課題一覧へ
						</Link>
						<Link
							className="text-muted-foreground hover:underline"
							href="/results/running"
						>
							runningへ
						</Link>
						<Link
							className="text-muted-foreground hover:underline"
							href="/result"
						>
							単一結果ページへ
						</Link>
					</div>
					<div className="mt-3 rounded border p-4 text-sm">
						<p className="font-medium">次に見る場所</p>
						<ul className="mt-2 list-disc pl-5 text-muted-foreground">
							<li>
								APIルートが未実装なら{" "}
								<span className="font-mono">/api/results/[resultId]</span>{" "}
								を作る
							</li>
							<li>APIが別パスなら、このファイルの fetch URL を合わせる</li>
						</ul>
					</div>
				</div>
			) : (
				<div className="mt-6 space-y-4">
					<div className="rounded border p-4">
						<div className="flex flex-wrap items-center gap-2 text-sm">
							<span className="text-muted-foreground">判定</span>
							<span className="font-medium">
								{typeof state.data.passed === "number" &&
								typeof state.data.total === "number"
									? `${state.data.passed} / ${state.data.total}`
									: "（取得中）"}
							</span>
						</div>

						{state.data.taskId ? (
							<div className="mt-2 text-sm">
								<Link
									className="text-muted-foreground hover:underline"
									href={`/tasks/${state.data.taskId}`}
								>
									タスクへ戻る
								</Link>
							</div>
						) : null}
					</div>

					<div className="rounded border p-4">
						<p className="text-sm font-medium">レスポンス</p>
						<pre className="mt-3 overflow-auto rounded bg-muted/30 p-3 text-xs">
							{JSON.stringify(state.data, null, 2)}
						</pre>
					</div>

					<div className="flex flex-wrap items-center gap-3 text-sm">
						<Link
							className="text-muted-foreground hover:underline"
							href="/tasks"
						>
							課題一覧へ
						</Link>
						<Link
							className="text-muted-foreground hover:underline"
							href="/results/running"
						>
							もう一度実行
						</Link>
					</div>
				</div>
			)}
		</main>
	);
}
