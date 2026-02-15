// apps/user/app/not-found.tsx
import { SfxLink as Link } from "@/components/ui/SfxLink";

export default function NotFound() {
	return (
		<main className="mx-auto max-w-5xl px-6 py-10">
			<div className="mb-6 flex justify-center">
				{/* biome-ignore lint/performance/noImgElement: static export 互換のため */}
				<img
					src={`/logos/${encodeURIComponent("404 NotFound.png")}`}
					alt="404 NotFound"
					className="h-32 w-full max-w-xs object-contain"
				/>
			</div>

			<h1 className="text-2xl font-bold tracking-tight">
				ページが見つからない
			</h1>
			<p className="mt-2 text-sm text-muted-foreground">
				URLが間違っているか、ページが移動した可能性があるよ。
			</p>

			<div className="mt-6">
				<Link
					href="/"
					className="text-sm text-muted-foreground hover:underline"
				>
					トップへ戻る
				</Link>
			</div>
		</main>
	);
}
