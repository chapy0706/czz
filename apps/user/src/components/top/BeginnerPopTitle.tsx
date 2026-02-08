// apps/user/src/components/top/BeginnerPopTitle.tsx

"use client";

import * as React from "react";

type PopTitleStyleVars = React.CSSProperties & {
	"--czz-delay"?: string;
	"--czz-rot"?: string;
};

type Size = "sm" | "md" | "lg" | "xl";

type Props = {
	/** デフォルトは「指示厨ゲーム」 */
	text?: string;
	/** 文字が落ちてくる“時間差”の間隔（ms） */
	staggerMs?: number;
	/** 丸の大きさ（ベース）。個別のバラつきは内部で少し付ける */
	size?: Size;
};

const SIZE_MAP: Record<Size, string> = {
	sm: "text-3xl",
	md: "text-4xl",
	lg: "text-5xl",
	xl: "text-6xl",
};

const VARIANTS: Array<{ className: string }> = [
	{
		className:
			"h-14 w-14 text-3xl ring-2 ring-pink-300 bg-pink-200 text-slate-800 rotate-2 -translate-y-0.5",
	},
	{
		className:
			"h-12 w-12 text-2xl ring-1 ring-sky-300 bg-sky-200 text-slate-800 -rotate-2 translate-y-0.5",
	},
	{
		className:
			"h-16 w-16 text-3xl ring-4 ring-emerald-300 bg-emerald-200 text-slate-800 rotate-1 translate-x-0.5",
	},
	{
		className:
			"h-11 w-11 text-2xl ring-2 ring-amber-300 bg-amber-200 text-slate-800 -rotate-1 -translate-x-0.5",
	},
	{
		className:
			"h-14 w-14 text-3xl ring-2 ring-teal-300 bg-teal-200 text-slate-800 rotate-3 translate-y-1",
	},
	{
		className:
			"h-14 w-14 text-2xl ring-1 ring-violet-300 bg-violet-200 text-slate-800 -rotate-3 -translate-y-1",
	},
];

export function BeginnerPopTitle({
	text = "指示厨ゲーム",
	staggerMs = 70,
	size = "lg",
}: Props) {
	const chars = React.useMemo(() => [...text], [text]);
	const isSixChars = chars.length === 6;

	if (!isSixChars) {
		return (
			<div className="select-none">
				<div className={`font-extrabold tracking-wide ${SIZE_MAP[size]}`}>
					{chars.map((ch, idx) => {
						const delay = `${idx * staggerMs}ms`;
						const rot = idx % 2 === 0 ? "-7deg" : "7deg";
						const styleVars: PopTitleStyleVars = {
							"--czz-delay": delay,
							"--czz-rot": rot,
						};

						return (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: 演出用（順序固定のため問題になりにくい）
								key={idx}
								className="inline-block align-middle"
								style={styleVars}
							>
								<span className="inline-grid place-items-center rounded-full border px-2 py-1">
									{ch}
								</span>
							</span>
						);
					})}
				</div>
			</div>
		);
	}

	return (
		<div className="select-none">
			<div className="font-extrabold tracking-wide">
				<div className="grid grid-cols-3 grid-rows-2 gap-1.5 sm:grid-cols-6 sm:grid-rows-1 sm:gap-2">
					{chars.map((ch, idx) => {
						const variant = VARIANTS[idx];

						return (
							<span
								// biome-ignore lint/suspicious/noArrayIndexKey: 6文字固定の演出で順序が変わらないため
								key={idx}
								className={`inline-grid place-items-center rounded-full leading-none ${variant.className}`}
							>
								{ch}
							</span>
						);
					})}
				</div>
			</div>
		</div>
	);
}
