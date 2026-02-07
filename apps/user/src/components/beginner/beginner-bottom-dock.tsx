// apps/user/src/components/beginner/beginner-bottom-dock.tsx

import type * as React from "react";

type Props = {
	/** 左側に置くパネル（例：いっしょにやろうキャラ） */
	left: React.ReactNode;
	/** 右側に置くパネル（例：音量/BGM パネル） */
	right: React.ReactNode;
	className?: string;
	/** iPhone のホームバー対策など、下方向の安全余白 */
	safeBottomClassName?: string;
	"data-testid"?: string;
};

/**
 * 初心者モードの固定UI（複数パネル）を 1 つのドックに集約する。
 *
 * 目的:
 * - 各パネルが個別に fixed を持って衝突するのを防ぐ
 * - pointer-events の責務をドックに寄せて、子パネルは通常レイアウトで描けるようにする
 * - 横向き（高さが低い端末）でも画面を埋めにくいように、右パネル側を縮小・スクロール可能にする
 */
export function BeginnerBottomDock({
	left,
	right,
	className,
	safeBottomClassName = "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
	"data-testid": dataTestId = "beginner-bottom-dock",
}: Props) {
	return (
		<div
			className={[
				"pointer-events-none fixed inset-x-0 bottom-0 z-50",
				"px-3",
				safeBottomClassName,
				className ?? "",
			]
				.filter(Boolean)
				.join(" ")}
			data-testid={dataTestId}
			aria-hidden="true"
		>
			<div
				className={[
					"mx-auto flex max-w-5xl flex-col gap-2",
					"[@media(orientation:landscape)]:flex-row",
					"[@media(orientation:landscape)]:items-end",
					"[@media(orientation:landscape)]:justify-end",
				].join(" ")}
			>
				<div
					className={[
						"pointer-events-auto",
						"[@media(orientation:landscape)]:mr-auto",
					].join(" ")}
				>
					{left}
				</div>

				<div
					className={[
						"pointer-events-auto",
						"[@media(orientation:landscape)]:origin-bottom-right",
						"[@media(orientation:landscape)]:scale-[0.9]",
						"[@media(orientation:landscape)]:max-h-[55vh]",
						"[@media(orientation:landscape)]:overflow-auto",
					].join(" ")}
				>
					{right}
				</div>
			</div>
		</div>
	);
}
