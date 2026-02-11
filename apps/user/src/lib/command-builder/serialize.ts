// apps/user/src/lib/command-builder/serialize.ts
import {
	type CommandType,
	getCatalogItem,
	isCommandType,
} from "@/lib/command-builder/commandCatalog";
import { isRecord } from "@/lib/shared/unknown";
import type { RunnerIoPreset } from "@/lib/terminal/runnerIo";
import { safeJsonCompact } from "@/lib/utils/safeStringify";

type AnyCommand = { value: unknown };

/**
 * コマンド列 + Runner I/O の内容が変わったかを判定するためのキー。
 * （副作用は持たず、UI の resetKey 用に使う）
 */
export function buildResetKey(
	commands: AnyCommand[],
	runnerIo?: RunnerIoPreset,
): string {
	return (
		safeJsonCompact({
			commands: commands.map((c) => c.value),
			runnerIo: runnerIo ?? null,
		}) || ""
	);
}

function cmdTypeOf(value: unknown): CommandType | null {
	if (!isRecord(value)) return null;
	const t = value.type;
	if (typeof t !== "string") return null;
	if (!isCommandType(t)) return null;
	return t;
}

function formatParamValue(value: unknown): string {
	if (value === undefined || value === null) return "?";
	if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
	return String(value);
}

export function serializeCommandsForDisplay(commands: AnyCommand[]): string[] {
	return commands.map((cmd) => {
		const record = isRecord(cmd.value) ? cmd.value : null;
		const type = cmdTypeOf(cmd.value);
		if (!type) return "UNKNOWN";

		const item = getCatalogItem(type);
		const label = item?.label ?? type;

		const params = item?.params ?? [];
		if (params.length === 0) return label;

		const paramText = params
			.map((p) => {
				const raw = record ? record[p.key] : undefined;
				return `${p.label ?? p.key}=${formatParamValue(raw)}`;
			})
			.join(", ");

		return `${label} (${paramText})`;
	});
}
