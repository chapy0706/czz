// apps/user/src/components/beginner/beginner-mascot-dock.tsx
"use client";

import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import Image from "next/image";

const DEFAULT_SRC = "/assets/characters/studying.gif";
const DEFAULT_ALT = "初心者モードの案内キャラクター";

/**
 * 初心者モード中だけ、キャラを常駐させる。
 *
 * 注意:
 * - 位置固定（fixed / bottom-* / right-* など）は BeginnerBottomDock が担当する
 * - このコンポーネントは “中身だけ” を返す
 */
export function BeginnerMascotDock() {
	const mode = useUiModeStore((s) => s.mode);

	if (mode !== "beginner") return null;

	// “フル表示” は「幅 >= 640px かつ 高さ >= 520px」のときだけ
	const desktopQuery = "[@media(min-width:640px)_and_(min-height:520px)]";

	return (
		<div className="select-none">
			<div className="rounded-2xl border bg-background/80 px-3 py-2 shadow-sm backdrop-blur">
				<div className="flex items-center gap-3">
					<div
						className={[
							"relative overflow-hidden rounded-full border bg-white",
							"h-11 w-11",
							`${desktopQuery}:h-14`,
							`${desktopQuery}:w-14`,
						].join(" ")}
					>
						<Image src={DEFAULT_SRC} alt={DEFAULT_ALT} fill sizes="56px" />
					</div>

					<div className="min-w-0">
						<div
							className={[
								"font-medium leading-tight",
								"text-xs",
								`${desktopQuery}:text-sm`,
							].join(" ")}
						>
							いっしょにやろう
						</div>

						<div
							className={[
								"mt-0.5 text-muted-foreground",
								"hidden",
								`${desktopQuery}:block`,
								"text-xs",
							].join(" ")}
						>
							まずは日本語の指示だけで組み立てよう。
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
