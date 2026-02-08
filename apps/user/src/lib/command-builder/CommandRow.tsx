// apps/user/src/lib/command-builder/CommandRow.tsx
"use client";

import * as React from "react";

import {
	type CommandType,
	getCatalogItem,
} from "@/lib/command-builder/commandCatalog";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type Props = {
	command: { id: string; value: any };
	index: number;
	isSelected: boolean;
	onSelect: () => void;
	onEdit: () => void;
	onRemove: () => void;
	onReorder: (from: number, to: number) => void;
	variant?: string;
};

export function CommandRow({
	command,
	index,
	isSelected,
	onSelect,
	onEdit,
	onRemove,
	onReorder,
	variant,
}: Props) {
	const mode = useUiModeStore((s) => s.mode);
	const isBeginner = mode === "beginner";

	const type = command.value?.type as CommandType | undefined;
	const cat = type ? getCatalogItem(type) : undefined;

	// ✅ beginnerName ではなく beginnerLabel
	const title = isBeginner
		? (cat?.ui.beginnerLabel ?? type ?? "UNKNOWN")
		: (type ?? "UNKNOWN");

	const _isChip = variant === "chip";
	const sub = isBeginner
		? (cat?.ui.beginnerExample ?? "")
		: "Swipe: → edit / ← delete";

	const startXref = React.useRef<number | null>(null);

	function onPointerDown(e: React.PointerEvent) {
		startXref.current = e.clientX;
	}

	function onPointerUp(e: React.PointerEvent) {
		const startX = startXref.current;
		startXref.current = null;
		if (startX == null) return;

		const dx = e.clientX - startX;
		const absDx = Math.abs(dx);

		if (absDx < 20) return;

		if (dx > 0) onEdit();
		else onRemove();
	}

	const base =
		variant === "chip"
			? "relative flex items-center gap-2 rounded border px-3 py-2 text-sm"
			: "relative flex items-center justify-between gap-2 rounded border px-3 py-2";

	const selected =
		"bg-accent/60 ring-2 ring-foreground/10 border-foreground/10";
	const normal = "bg-background";

	return (
		<div
			className={`${base} ${isSelected ? selected : normal}`}
			data-testid-index={`cmd-row-${index}`}
			data-testid={`cb-item-${type}`}
		>
			<div
				className={`absolute left-0 top-0 h-full w-1 rounded-l ${
					isSelected ? "bg-foreground/30" : "bg-transparent"
				}`}
				aria-hidden="true"
			/>

			<button
				type="button"
				className="min-w-0 flex-1 text-left"
				onClick={onSelect}
				onPointerDown={onPointerDown}
				onPointerUp={onPointerUp}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") onSelect();
				}}
			>
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<div
							className={
								isBeginner ? "text-sm font-semibold" : "font-mono text-sm"
							}
						>
							{title}
						</div>
					</div>

					{variant !== "chip" && sub ? (
						<div className="text-xs text-muted-foreground">{sub}</div>
					) : null}
				</div>
			</button>

			<div className="flex items-center gap-2">
				<button
					type="button"
					className="rounded border px-2 py-1 text-xs hover:bg-accent"
					onClick={(e) => {
						e.stopPropagation();
						onEdit();
					}}
					data-testid={`cmd-edit-${index}`}
					aria-label="edit command"
					title="Edit"
				>
					{isBeginner ? "編集" : "Edit"}
				</button>

				<button
					type="button"
					className="rounded border px-2 py-1 text-xs hover:bg-accent"
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					data-testid={`cmd-del-${index}`}
					aria-label="delete command"
					title="Delete"
				>
					{isBeginner ? "削除" : "Del"}
				</button>
			</div>
		</div>
	);
}
