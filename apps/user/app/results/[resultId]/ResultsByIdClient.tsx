// apps/user/app/results/[resultId]/ResultsByIdClient.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type Props = {
	resultId: string;
};

type ApiOk = {
	ok: true;
	resultId: string;
	passed: number;
	total: number;
	output?: unknown;
	taskId?: string;
	createdAt?: string;
	cases?: Array<{
		index: number;
		input: number[];
		expected: number[];
		actual: number[];
		passed: boolean;
	}>;
};

type ApiErr = {
	ok: false;
	error: string;
};

function formatNumberList(values: number[]): string {
	if (values.length === 0) return "（空）";
	return values.join(", ");
}

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
	const mode = useUiModeStore((s) => s.mode);
	const isBeginner = mode === "beginner";
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
			</div>

			{state.status === "loading" ? (
				<div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
					{isBeginner ? "読み込み中…" : "loading…"}
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
							{isBeginner ? "実行中へ" : "runningへ"}
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
				<div className="mt-6 space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>サマリ</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex flex-wrap items-center gap-3 text-sm">
								<span className="text-muted-foreground">判定</span>
								<span
									className={[
										"rounded-full px-2 py-0.5 text-xs font-semibold",
										state.data.passed === state.data.total
											? "bg-emerald-100 text-emerald-700"
											: "bg-rose-100 text-rose-700",
									].join(" ")}
								>
									{state.data.passed === state.data.total ? "成功" : "失敗"}
								</span>
								{/* biome-ignore lint/performance/noImgElement: static export */}
								<img
									src={
										state.data.passed === state.data.total
											? "/assets/characters/rejoicing.gif"
											: "/assets/characters/failing.gif"
									}
									alt={
										state.data.passed === state.data.total
											? isBeginner
												? "やったね！"
												: "Success"
											: isBeginner
												? "うまくいかなかった…"
												: "Failed"
									}
									className="mx-auto h-32 w-32 object-contain"
								/>
								<span className="font-medium">
									{state.data.passed} / {state.data.total}
								</span>
							</div>

							<div className="flex flex-wrap items-center gap-3 text-sm">
								{state.data.taskId ? (
									<Link
										className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
										href={`/tasks/${state.data.taskId}`}
									>
										タスクへ戻る
									</Link>
								) : null}
								<Link
									className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
									href="/tasks"
								>
									課題一覧へ
								</Link>
								<Link
									className="rounded border px-3 py-1.5 text-sm hover:bg-muted"
									href="/results/running"
								>
									もう一度実行
								</Link>
							</div>
						</CardContent>
					</Card>

					{state.data.cases && state.data.cases.length > 0 ? (
						<Card>
							<CardHeader>
								<CardTitle>テストケース</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{state.data.cases.map((c) => (
									<details key={c.index} className="rounded border px-3 py-2">
										<summary className="cursor-pointer list-none">
											<div className="flex flex-wrap items-center gap-3 text-sm">
												<span className="font-semibold">
													{isBeginner
														? `ケース ${c.index + 1}`
														: `Case #${c.index + 1}`}
												</span>
												<span
													className={[
														"rounded-full px-2 py-0.5 text-xs font-semibold",
														c.passed
															? "bg-emerald-100 text-emerald-700"
															: "bg-rose-100 text-rose-700",
													].join(" ")}
												>
													{c.passed
														? isBeginner
															? "正解"
															: "passed"
														: isBeginner
															? "不正解"
															: "failed"}
												</span>
											</div>
										</summary>

										<div className="mt-3 space-y-3 text-sm">
											<div>
												<div className="text-xs font-semibold text-muted-foreground">
													{isBeginner ? "入力データ" : "input"}
												</div>
												<div className="mt-1 rounded bg-muted/40 p-2 text-xs">
													{formatNumberList(c.input)}
												</div>
											</div>
											<div>
												<div className="text-xs font-semibold text-muted-foreground">
													{isBeginner ? "正しい答え" : "expected"}
												</div>
												<div className="mt-1 rounded bg-muted/40 p-2 text-xs">
													{formatNumberList(c.expected)}
												</div>
											</div>
											<div>
												<div className="text-xs font-semibold text-muted-foreground">
													{isBeginner ? "あなたの出力" : "actual"}
												</div>
												<div className="mt-1 rounded bg-muted/40 p-2 text-xs">
													{formatNumberList(c.actual)}
												</div>
											</div>

											{!isBeginner ? (
												<details className="rounded border px-3 py-2 text-xs">
													<summary className="cursor-pointer list-none text-muted-foreground">
														raw JSON
													</summary>
													<pre className="mt-2 rounded bg-muted/40 p-2 text-xs">
														{JSON.stringify(c, null, 2)}
													</pre>
												</details>
											) : null}
										</div>
									</details>
								))}
							</CardContent>
						</Card>
					) : null}
				</div>
			)}
		</main>
	);
}
