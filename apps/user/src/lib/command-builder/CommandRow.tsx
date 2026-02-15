// apps/user/src/lib/command-builder/CommandRow.tsx
"use client";

import {
	type CommandType,
	getCatalogItem,
} from "@/lib/command-builder/commandCatalog";
import { useSwipeActions } from "@/lib/command-builder/useSwipeActions";
import { getString, isRecord } from "@/lib/shared/unknown";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type Props = {
	command: { id: string; value: unknown };
	index: number;
	isSelected: boolean;
	onEdit: () => void;
	onRemove: () => void;
	onReorder: (from: number, to: number) => void;
	variant?: string;
};

export function CommandRow({
	command,
	index,
	isSelected,
	onEdit,
	onRemove,
	onReorder: _onReorder,
	variant,
}: Props) {
	const mode = useUiModeStore((s) => s.mode);
	const isBeginner = mode === "beginner";

	const valueRecord = isRecord(command.value) ? command.value : null;
	const type = (getString(valueRecord, "type") ?? undefined) as
		| CommandType
		| undefined;
	const cat = type ? getCatalogItem(type) : undefined;

	// ✅ beginnerName ではなく beginnerLabel
	const title = isBeginner
		? (cat?.ui.beginnerLabel ?? type ?? "UNKNOWN")
		: (type ?? "UNKNOWN");

	const _isChip = variant === "chip";
	const sub = isBeginner
		? (cat?.ui.beginnerExample ?? "")
		: "Swipe: → edit / ← delete";

	const swipe = useSwipeActions({
		onSwipeLeft: () => {
			onRemove();
		},
		onSwipeRight: () => {
			onEdit();
		},
	});

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
			onPointerDown={swipe.handlers.onPointerDown}
			onPointerMove={swipe.handlers.onPointerMove}
			onPointerUp={swipe.handlers.onPointerUp}
			onPointerCancel={swipe.handlers.onPointerCancel}
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
				onClick={() => {
					if (swipe.isSwiping) return;
					onEdit();
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") onEdit();
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
		</div>
	);
}
