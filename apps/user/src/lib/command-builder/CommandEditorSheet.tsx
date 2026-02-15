// apps/user/src/lib/command-builder/CommandEditorSheet.tsx
"use client";

import * as React from "react";

import {
	type CommandDraft,
	useCommandBuilderStore,
} from "@/lib/command-builder/commandBuilderStore";
import {
	type CommandType,
	getCatalogItem,
} from "@/lib/command-builder/commandCatalog";
import { isRecord } from "@/lib/shared/unknown";
import { useUiModeStore } from "@/lib/ui-mode/uiModeStore";

type Props = {
	selected: CommandDraft | null;
	onClose: () => void;
	onSave: (nextValue: unknown) => void;
	onRemove: () => void;
};

type Mode = "basic" | "advanced";

function extractType(value: unknown): string {
	if (!isRecord(value)) return "UNKNOWN";
	return typeof value.type === "string" ? value.type : "UNKNOWN";
}

function asObject(value: unknown): Record<string, unknown> {
	if (isRecord(value)) return value;
	return {};
}

function stripHiddenKeys(
	value: Record<string, unknown>,
	params: NonNullable<ReturnType<typeof getCatalogItem>>["params"] | undefined,
) {
	const next = { ...value };
	for (const p of params ?? []) {
		if (p.ui?.hideInEditor) delete next[p.key];
	}
	return next;
}

export function CommandEditorSheet(props: Props) {
	const { selected, onClose, onSave, onRemove } = props;
	const isBeginner = useUiModeStore((s) => s.mode === "beginner");
	const setEditingDraft = useCommandBuilderStore((s) => s.setEditingDraft);
	const clearEditingDraft = useCommandBuilderStore((s) => s.clearEditingDraft);

	const [mode, setMode] = React.useState<Mode>("basic");
	const [advancedJson, setAdvancedJson] = React.useState<string>("");
	const [basicValues, setBasicValues] = React.useState<Record<string, unknown>>(
		{},
	);
	const [error, setError] = React.useState<string | null>(null);
	const typeRaw = selected ? extractType(selected.value) : "UNKNOWN";

	React.useEffect(() => {
		if (!selected) return;
		const base = asObject(selected.value);
		const draftValue = { ...base, type: typeRaw, ...basicValues };
		setEditingDraft(selected.id, draftValue);
	}, [basicValues, selected, setEditingDraft, typeRaw]);

	React.useEffect(() => {
		if (!selected) return;

		const typeRaw = extractType(selected.value);
		const cat = getCatalogItem(typeRaw as CommandType);

		// 初心者モードでは advanced は見せない想定（切替 UI も消してる）
		setMode("basic");
		const base = asObject(selected.value);
		const withoutHidden = stripHiddenKeys(base, cat?.params);
		setAdvancedJson(JSON.stringify(withoutHidden, null, 2));

		const init: Record<string, unknown> = {};
		const obj = asObject(selected.value);

		for (const p of cat?.params ?? []) {
			init[p.key] = obj[p.key] ?? "";
		}

		setBasicValues(init);
		setError(null);
	}, [selected]);

	if (!selected) return null;

	const cat = getCatalogItem(typeRaw as CommandType);

	const title = isBeginner ? "コマンドの設定" : "Command Editor";
	const label = isBeginner
		? (cat?.ui.beginnerLabel ?? cat?.label ?? typeRaw)
		: typeRaw;
	const help = isBeginner
		? (cat?.ui.beginnerExample ?? "")
		: (cat?.unixHint ?? "");

	const canShowAdvanced = !isBeginner;

	function onSubmitBasic() {
		setError(null);

		const base = asObject(selected.value);
		const next: Record<string, unknown> = { ...base, type: typeRaw };

		for (const p of cat?.params ?? []) {
			if (p.ui?.hideInEditor) continue;
			const raw = basicValues[p.key];

			// required チェック（空文字も未入力扱い）
			if (p.required && (raw === "" || raw === undefined || raw === null)) {
				setError(
					isBeginner
						? `「${p.beginnerLabel ?? p.label}」は必須だよ。`
						: `${p.key} is required`,
				);
				return;
			}

			// 未入力（任意）ならフィールド自体を持たないようにしておく
			if (!p.required && (raw === "" || raw === undefined || raw === null)) {
				delete next[p.key];
				continue;
			}

			// ✅ schema で安全に型を確定して保存する（number でも string のまま送らない）
			const parsed = p.schema.safeParse(raw);
			if (!parsed.success) {
				setError(
					isBeginner
						? `「${p.beginnerLabel ?? p.label}」の値が変だよ。入力例を参考にしてね。`
						: `${p.key} is invalid`,
				);
				return;
			}

			next[p.key] = parsed.data;
		}

		for (const p of cat?.params ?? []) {
			const fixed = p.ui?.fixedValueInEditor;
			if (fixed === undefined) continue;
			const parsedFixed = p.schema.safeParse(fixed);
			if (!parsedFixed.success) {
				setError(
					isBeginner
						? `「${p.beginnerLabel ?? p.label}」の固定値が不正だよ。`
						: `${p.key} fixed value is invalid`,
				);
				return;
			}
			next[p.key] = parsedFixed.data;
		}

		clearEditingDraft();
		onSave(next);
		onClose();
	}

	function onSubmitAdvanced() {
		setError(null);

		try {
			const parsed: unknown = JSON.parse(advancedJson);
			if (!isRecord(parsed)) {
				setError("JSON must be an object");
				return;
			}
			const next = { ...parsed, type: typeRaw } as Record<string, unknown>;
			for (const p of cat?.params ?? []) {
				const fixed = p.ui?.fixedValueInEditor;
				if (fixed === undefined) continue;
				const parsedFixed = p.schema.safeParse(fixed);
				if (!parsedFixed.success) {
					setError(`${p.key} fixed value is invalid`);
					return;
				}
				next[p.key] = parsedFixed.data;
			}
			clearEditingDraft();
			onSave(next);
			onClose();
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Invalid JSON";
			setError(message);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-2">
			<div className="w-full max-w-xl rounded-2xl border bg-background shadow-xl">
				<div className="flex items-start justify-between gap-3 border-b p-4">
					<div className="min-w-0">
						<div className="text-sm text-muted-foreground">{title}</div>
						<div
							className={
								isBeginner ? "text-lg font-semibold" : "font-mono text-lg"
							}
						>
							{label}
						</div>
						{help ? (
							<div className="mt-1 text-xs text-muted-foreground">{help}</div>
						) : null}
					</div>

					<button
						type="button"
						onClick={() => {
							clearEditingDraft();
							onClose();
						}}
						className="rounded-lg border px-3 py-2 text-sm hover:bg-muted"
					>
						{isBeginner ? "閉じる" : "Close"}
					</button>
				</div>

				{canShowAdvanced ? (
					<div className="flex items-center justify-between border-b px-4 py-2">
						<div className="text-sm text-muted-foreground">Mode</div>
						<div className="flex gap-2">
							<button
								type="button"
								className={[
									"rounded-lg border px-3 py-1 text-sm",
									mode === "basic" ? "bg-muted" : "hover:bg-muted/50",
								].join(" ")}
								onClick={() => setMode("basic")}
							>
								Basic
							</button>
							<button
								type="button"
								className={[
									"rounded-lg border px-3 py-1 text-sm",
									mode === "advanced" ? "bg-muted" : "hover:bg-muted/50",
								].join(" ")}
								onClick={() => setMode("advanced")}
							>
								Advanced(JSON)
							</button>
						</div>
					</div>
				) : null}

				<div className="p-4">
					{error ? (
						<div className="mb-3 rounded-lg border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm">
							{error}
						</div>
					) : null}

					{mode === "advanced" && canShowAdvanced ? (
						<div className="space-y-2">
							<textarea
								value={advancedJson}
								onChange={(e) => setAdvancedJson(e.target.value)}
								className="h-56 w-full rounded-xl border p-3 font-mono text-xs"
							/>
							<div className="flex justify-end">
								<button
									type="button"
									onClick={onSubmitAdvanced}
									className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
								>
									Save
								</button>
							</div>
						</div>
					) : (
						<div className="space-y-3">
							{(cat?.params?.length ?? 0) === 0 ? (
								<div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
									{isBeginner
										? "このコマンドは設定いらないよ。"
										: "No parameters."}
								</div>
							) : null}

							{cat?.params?.map((p) => {
								if (p.ui?.hideInEditor) return null;
								const fieldLabel = isBeginner
									? (p.beginnerLabel ?? p.label)
									: p.label;
								const placeholder = isBeginner
									? (p.beginnerPlaceholder ?? "")
									: "";
								const v = basicValues[p.key] ?? "";

								return (
									<div key={p.key} className="space-y-1">
										<div className="flex items-center gap-2">
											<div className="text-sm font-medium">{fieldLabel}</div>
											{p.required ? (
												<span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
													{isBeginner ? "必須" : "required"}
												</span>
											) : null}
										</div>

										<input
											value={String(v)}
											onChange={(e) =>
												setBasicValues((prev) => {
													const next = {
														...prev,
														[p.key]: e.target.value,
													};
													return next;
												})
											}
											className="w-full rounded-xl border px-3 py-2 text-sm"
											placeholder={placeholder}
										/>

										{isBeginner && p.beginnerHelp ? (
											<div className="text-xs text-muted-foreground">
												{p.beginnerHelp}
											</div>
										) : null}
									</div>
								);
							})}

							<div className="flex justify-end gap-2 pt-2">
								<button
									type="button"
									onClick={() => {
										if (!window.confirm("このコマンドを削除しますか？")) return;
										onRemove();
									}}
									className="rounded-lg border px-4 py-2 text-sm text-destructive hover:bg-muted"
								>
									{isBeginner ? "コマンド削除" : "Delete"}
								</button>
								<button
									type="button"
									onClick={() => {
										clearEditingDraft();
										onClose();
									}}
									className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
								>
									{isBeginner ? "もどる" : "Cancel"}
								</button>
								<button
									type="button"
									onClick={onSubmitBasic}
									className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
								>
									{isBeginner ? "OK" : "Save"}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
