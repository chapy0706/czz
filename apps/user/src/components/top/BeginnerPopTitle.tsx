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

export function BeginnerPopTitle({
	text = "指示厨ゲーム",
	staggerMs = 70,
	size = "lg",
}: Props) {
	const chars = React.useMemo(() => [...text], [text]);

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
