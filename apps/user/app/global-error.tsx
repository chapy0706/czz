// apps/user/app/global-error.tsx
"use client";

import * as React from "react";

type Props = {
	error: Error & { digest?: string };
	reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
	React.useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<html lang="ja">
			<body>
				<main className="mx-auto max-w-5xl px-6 py-10">
					<h1 className="text-2xl font-bold tracking-tight">
						致命的なエラーが発生した
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						アプリ全体の読み込みに失敗した。再試行してね。
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
			</body>
		</html>
	);
}
