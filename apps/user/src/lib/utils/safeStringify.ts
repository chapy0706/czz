// apps/user/src/lib/utils/safeStringify.ts

/**
 * JSON.stringify が落ちるケース（循環参照など）でも、UI を壊さずに文字列化する。
 * bigint も安全に扱う。
 */
export function safeStringify(value: unknown, space: number = 2): string {
  try {
    return JSON.stringify(
      value,
      (_k, v) => (typeof v === "bigint" ? v.toString() : v),
      space,
    );
  } catch {
    try {
      return String(value);
    } catch {
      return "[unstringifiable]";
    }
  }
}

/**
 * localStorage 等に入れる用のコンパクト版。
 */
export function safeJsonCompact(value: unknown): string {
  try {
    return JSON.stringify(value, (_k, v) =>
      typeof v === "bigint" ? v.toString() : v,
    );
  } catch {
    return "";
  }
}
