// apps/user/src/lib/terminal/formatOutput.ts
export function formatNumberList(xs: number[]): string {
  if (!Array.isArray(xs)) return "";
  return xs.join(", ");
}

export function formatUnknownAsText(value: unknown): string {
  if (Array.isArray(value) && value.every((v) => typeof v === "number")) {
    return formatNumberList(value as number[]);
  }
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
