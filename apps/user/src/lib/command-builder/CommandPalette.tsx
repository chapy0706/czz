// apps/user/src/lib/command-builder/CommandPalette.tsx
"use client";

import * as React from "react";

import {
	COMMAND_CATALOG,
	type CommandType,
} from "@/lib/command-builder/commandCatalog";

type UiMode = "beginner" | "normal";

type Props = {
	onAdd: (type: CommandType) => void;

	/**
	 * 以前はここに実行ボタンが同居していた名残。
	 * 発表P0（初心者導線）では CommandBuilder 側で常時表示する方針へ寄せるため、
	 * この Props は互換目的で残しつつ、ここでは使用しない。
	 */
	runButton?: {
		taskId: string | null;
		userId?: string;
		resetKey: string;
		getSubmittedProgram: () => unknown;
		navigateTo: string;
		autoNavigateOnComplete: boolean;
	};

	/** 既定: "normal" */
	uiMode?: UiMode;
};

export function CommandPalette(props: Props) {
	const { onAdd, uiMode = "normal" } = props;

	const items = React.useMemo(() => COMMAND_CATALOG, []);

	return (
		<div className="rounded border p-3">
			<div className="mb-2 text-xs font-semibold opacity-70">Command</div>

			{/* “コマンドを並べる” 体験が主役なので、ターミナルっぽいトークン表示に寄せる */}
			<div className="flex flex-wrap gap-2">
				{items.map((item) => {
					const label =
						uiMode === "beginner" ? item.ui.beginnerLabel : item.label;

					return (
						<button
							key={item.type}
							type="button"
							className="rounded border px-2 py-1 font-mono text-sm hover:bg-muted"
							onClick={() => onAdd(item.type)}
							title={item.unixHint}
							data-testid={`cb-add-${item.type}`}
						>
							{label}
						</button>
					);
				})}
			</div>
		</div>
	);
}
