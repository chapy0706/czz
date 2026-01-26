// apps/user/src/lib/utils/formatOutput.ts
type Human = {
  kind: "numberSeries";
  value: number[];
  meta?: { label?: string };
};

function isNumberArray(v: unknown): v is number[] {
  return (
    Array.isArray(v) &&
    v.every((x) => typeof x === "number" && Number.isFinite(x))
  );
}

/** 例: [1, 2, 10] を "1, 2, 10" にする */
export function formatNumberSeries(nums: number[]): string {
  if (nums.length === 0) return "（空）";
  return nums.join(", ");
}

/**
 * 出力を「人が読みやすい」形に寄せる（JSON を避ける）
 * - number[] は数列として表示
 * - それ以外は最小限に stringify
 */
export function formatOutputHuman(output: unknown): string {
  if (output === undefined) return "（出力なし）";
  if (output === null) return "null";
  if (typeof output === "string") return output;
  if (typeof output === "number" && Number.isFinite(output))
    return String(output);
  if (typeof output === "boolean") return output ? "true" : "false";

  if (isNumberArray(output)) {
    return formatNumberSeries(output);
  }

  // Human を想定した形（拡張余地）
  if (output && typeof output === "object") {
    const obj = output as Partial<Human>;
    if (obj.kind === "numberSeries" && Array.isArray(obj.value)) {
      return formatNumberSeries(obj.value as number[]);
    }
  }

  try {
    return JSON.stringify(output, null, 2);
  } catch {
    return String(output);
  }
}
