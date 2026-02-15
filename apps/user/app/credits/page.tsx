// apps/user/app/credits/page.tsx

import { SfxLink as Link } from "@/components/ui/SfxLink";

type CreditItem = {
	label: string;
	name: string;
	url: string;
	note?: string;
};

type LogoItem = {
	name: string;
	fileName: string;
	href?: string;
};

const CREDITS: CreditItem[] = [
	{
		label: "キャラクターアイコン",
		name: "ゆるいせかい 様",
		url: "https://yuruisekai.whatshallwedotoday.net/",
	},
	{
		label: "動くキャラクター",
		name: "うごかわっ 様",
		url: "https://ugokawaii.com/",
	},
	{
		label: "BGM全般",
		name: "魔王魂 様",
		url: "https://maou.audio/",
	},
	{
		label: "効果音全般",
		name: "効果音ラボ 様",
		url: "https://soundeffect-lab.info/",
	},
];

const LOGOS: LogoItem[] = [
	{
		name: "Next.js",
		fileName: "Next.js.png",
		href: "https://nextjs.org",
	},
	{
		name: "React",
		fileName: "React.png",
		href: "https://react.dev",
	},
	{
		name: "Tailwind CSS",
		fileName: "Tailwindcss.png",
		href: "https://tailwindcss.com",
	},
	{
		name: "TypeScript",
		fileName: "TypeScript.png",
		href: "https://www.typescriptlang.org",
	},
	{
		name: "GitHub",
		fileName: "GitHub.png",
		href: "https://github.com",
	},
];

const LOGO_BY_NAME = new Map(LOGOS.map((logo) => [logo.name, logo]));

const LIBRARIES = [
	"Next.js",
	"React",
	"Tailwind CSS",
	"TypeScript",
	"GitHub",
	"shadcn/ui",
	"Neon Auth",
] as const;

export const dynamic = "force-static";

export default function CreditsPage() {
	return (
		<main className="mx-auto max-w-3xl px-4 py-10">
			<header className="flex items-center justify-between gap-3">
				<h1 className="text-xl font-semibold">クレジット</h1>
				<Link
					href="/"
					className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-muted"
				>
					戻る
				</Link>
			</header>

			<p className="mt-3 text-sm text-muted-foreground">
				本アプリで使用している素材・音源の提供元一覧です。各提供元の利用規約・ライセンスに従って使用しています。
			</p>

			<section className="mt-8 rounded-2xl border p-5">
				<h2 className="text-base font-semibold">素材・音源</h2>

				<ul className="mt-4 space-y-3">
					{CREDITS.map((c) => (
						<li key={c.url} className="rounded-xl border bg-card/60 p-4">
							<div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
								<div className="min-w-0">
									<div className="text-sm font-semibold">{c.label}</div>
									<div className="mt-1 text-sm">
										<span className="font-medium">{c.name}</span>
										{c.note ? (
											<span className="ml-2 text-xs text-muted-foreground">
												{c.note}
											</span>
										) : null}
									</div>
								</div>

								<a
									href={c.url}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium hover:bg-muted"
									aria-label={`${c.name} のサイトを開く`}
								>
									サイトを見る
								</a>
							</div>

							<div className="mt-2 break-all text-xs text-muted-foreground">
								{c.url}
							</div>
						</li>
					))}
				</ul>

				<div className="mt-5 text-xs text-muted-foreground">
					※
					公開前に、各提供元の利用規約に基づく「表記方法」「改変可否」「商用利用可否」などを最終確認してください。
				</div>
			</section>

			<section className="mt-6 rounded-2xl border p-5">
				<h2 className="text-base font-semibold">使用ライブラリ</h2>
				<ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
					{LIBRARIES.map((name) => {
						const logo = LOGO_BY_NAME.get(name);
						const src = logo
							? `/logos/${encodeURIComponent(logo.fileName)}`
							: null;
						return (
							<li
								key={name}
								className="flex flex-col gap-2 rounded-xl border bg-card/60 p-3 text-sm"
							>
								{src ? (
									<div className="flex h-20 items-center justify-center rounded-lg bg-muted/30 p-2">
										{/* biome-ignore lint/performance/noImgElement: static export 互換のため */}
										<img
											src={src}
											alt={name}
											className="max-h-full w-full object-contain"
										/>
									</div>
								) : null}
								<div className="font-semibold">{name}</div>
								{logo?.href ? (
									<a
										href={logo.href}
										target="_blank"
										rel="noreferrer noopener"
										className="text-xs text-muted-foreground hover:underline"
									>
										公式サイト
									</a>
								) : null}
							</li>
						);
					})}
				</ul>

				<div className="mt-4 space-y-2 text-xs text-muted-foreground">
					<div>
						※ ロゴ画像は SAWARATSUKI 様の制作ロゴです:{" "}
						<a
							href="https://github.com/SAWARATSUKI/KawaiiLogos"
							target="_blank"
							rel="noreferrer noopener"
							className="underline"
						>
							https://github.com/SAWARATSUKI/KawaiiLogos
						</a>
					</div>
					<div>
						※ AI
						利用・商用利用に制限があります。詳細は出典のライセンスを参照してください
					</div>
					<div>各ロゴ・名称は各社の商標または登録商標です</div>
				</div>
			</section>
		</main>
	);
}
