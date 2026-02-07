// apps/user/src/lib/command-builder/serialize.ts
import type { RunnerIo } from "@/lib/terminal/runnerIo";
import { safeJsonCompact } from "@/lib/utils/safeStringify";

type AnyCommand = { value: unknown };

/**
 * コマンド列 + Runner I/O の内容が変わったかを判定するためのキー。
 * （副作用は持たず、UI の resetKey 用に使う）
 */
export function buildResetKey(
	commands: AnyCommand[],
	runnerIo?: RunnerIo,
): string {
	return (
		safeJsonCompact({
			commands: commands.map((c) => c.value),
			runnerIo: runnerIo ?? null,
		}) || ""
	);
}
