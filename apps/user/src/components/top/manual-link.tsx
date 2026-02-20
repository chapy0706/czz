// apps/user/src/components/top/manual-link.tsx

import { Leaf } from "lucide-react";

function pickManualUrl(value: string | undefined): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed) return null;

	try {
		const url = new URL(trimmed);
		if (url.protocol !== "https:") return null;
		if (!url.href.startsWith("https://docs.google.com/")) return null;
		return url.toString();
	} catch {
		return null;
	}
}

export function ManualLink() {
	const manualUrl = pickManualUrl(process.env.NEXT_PUBLIC_CZZ_MANUAL_URL);
	if (!manualUrl) return null;

	return (
		<a
			href={manualUrl}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="マニュアルを開く"
			title="マニュアルを開く"
			className={[
				"fixed left-4 bottom-4 z-50",
				"inline-flex h-12 w-12 items-center justify-center",
				"rounded-full bg-emerald-500 text-white shadow-lg",
				"transition hover:bg-emerald-400",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300",
				"focus-visible:ring-offset-2 focus-visible:ring-offset-background",
			].join(" ")}
		>
			<Leaf className="h-6 w-6" aria-hidden="true" />
		</a>
	);
}
