// apps/user/src/lib/command-builder/serialize.ts

import { safeJsonCompact } from "@/lib/utils/safeStringify";

type AnyCommand = { value: unknown };

/**
 * コマンド列の内容が変わったかを判定するためのキー。
 * （副作用は持たず、UI の resetKey 用に使う）
 */
export function buildResetKey(commands: AnyCommand[]): string {
  return safeJsonCompact(commands.map((c) => c.value)) || "";
}
