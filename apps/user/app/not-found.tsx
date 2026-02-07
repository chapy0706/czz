// apps/user/app/not-found.tsx
import { SfxLink as Link } from "@/components/ui/SfxLink";

export default function NotFound() {
	return (
		<main className="mx-auto max-w-5xl px-6 py-10">
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
