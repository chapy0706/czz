// apps/user/app/error.tsx
"use client";

import * as React from "react";

type Props = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
	React.useEffect(() => {
		// Next の Error Boundary はここに落ちてくる。ログは出しておく。
		console.error(error);
	}, [error]);

	return (
		<main className="mx-auto max-w-5xl px-6 py-10">
			<h1 className="text-2xl font-bold tracking-tight">エラーが発生した</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				表示中に問題が起きた。もう一度試してね。
			</p>

			<pre className="mt-4 max-h-[240px] overflow-auto rounded border bg-muted/20 p-3 text-xs">
				{error.message}
			</pre>

			<button
				type="button"
				className="mt-4 rounded border px-3 py-2 text-sm"
				onClick={reset}
			>
				再試行
			</button>
		</main>
	);
}
