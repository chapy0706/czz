// apps/user/src/components/providers/ui-mode-provider.tsx
"use client";

import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";
import { useTheme } from "next-themes";
import * as React from "react";

type Props = { children: React.ReactNode };

/**
 * UIモードの副作用をここに閉じ込める。
 *
 * 目的:
 * - beginner: 強制ライト + パステルCSS + 雰囲気統一
 * - advanced: 元のテーマに確実に復帰（ここが今の不具合ポイント）
 *
 * 重要:
 * next-themes は setTheme("light") すると localStorage の theme を更新する。
 * そのため「beginnerへ入る前の見た目」を自前で退避して、解除時に戻す必要がある。
 */
const THEME_BACKUP_KEY = "czz-theme-before-beginner";

function readAppliedTheme(): "dark" | "light" {
	// next-themes attribute="class" の場合、html に dark が付いているかで「適用中」を判定できる
	return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function UiModeProvider({ children }: Props) {
	const mode = useUiModeStore((s) => s.mode);
	const { setTheme } = useTheme();

	React.useEffect(() => {
		const root = document.documentElement;

		// CSS切替
		root.dataset.uiMode = mode;

		if (mode === "beginner") {
			// beginner に入った瞬間の「適用中テーマ」を一度だけ退避
			// (StrictModeでeffectが2回走る場合があるので、上書きしない)
			if (!window.localStorage.getItem(THEME_BACKUP_KEY)) {
				window.localStorage.setItem(THEME_BACKUP_KEY, readAppliedTheme());
			}

			// beginner は強制ライト（可愛いパステルを崩さない）
			setTheme("light");
			return;
		}

		// advanced に戻るとき: 退避したテーマへ復帰（なければ dark）
		const backup = window.localStorage.getItem(THEME_BACKUP_KEY);
		window.localStorage.removeItem(THEME_BACKUP_KEY);

		// 要望: beginner解除時はダークへ戻したい → backup が light でも dark へ倒す
		const next = backup === "dark" ? "dark" : "dark";
		setTheme(next);
	}, [mode, setTheme]);

	return <>{children}</>;
}
