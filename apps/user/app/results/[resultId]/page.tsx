// apps/user/app/results/[resultId]/page.tsx
import * as React from "react";
import ResultsByIdClient from "./ResultsByIdClient";

export const dynamic = "force-dynamic";

type PageProps = {
	params: Promise<{ resultId: string }>;
};

export default async function ResultByIdPage(props: PageProps) {
	const { resultId } = await props.params;

	return (
		<React.Suspense
			fallback={
				<main className="mx-auto max-w-5xl px-6 py-10">
					<div className="space-y-2">
						<h1 className="text-2xl font-bold tracking-tight">
							結果を読み込み中…
						</h1>
						<p className="text-sm text-muted-foreground">少し待ってね。</p>
					</div>
					<div className="mt-6 rounded border bg-muted/30 p-4 text-sm text-muted-foreground">
						loading…
					</div>
				</main>
			}
		>
			<ResultsByIdClient resultId={resultId} />
		</React.Suspense>
	);
}
