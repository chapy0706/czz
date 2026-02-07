// apps/user/src/lib/terminal/formatOutput.ts

/**
 * JSON表示を避けて、人間が読みやすい形に寄せるための整形ユーティリティ。
 * - 数値配列: "1, 2, 3"
 * - 2次元配列: 行ごとに改行
 * - それ以外: なるべく短く、最悪 safeStringify 相当
 */

import { safeStringify } from "@/lib/utils/safeStringify";

function isNumberArray(x: unknown): x is number[] {
	return (
		Array.isArray(x) &&
		x.every((v) => typeof v === "number" && Number.isFinite(v))
	);
}

function isNumberMatrix(x: unknown): x is number[][] {
	return (
		Array.isArray(x) &&
		x.every(
			(row) =>
				Array.isArray(row) &&
				row.every((v) => typeof v === "number" && Number.isFinite(v)),
		)
	);
}

export function formatNumberSeries(arr: number[]): string {
	return arr.join(", ");
}

export function formatNumberMatrix(mat: number[][]): string {
	return mat.map((row) => row.join(", ")).join("\n");
}

export function formatOutputHuman(value: unknown): string {
	if (value == null) return "";

	if (typeof value === "string") return value;

	if (isNumberArray(value)) return formatNumberSeries(value);

	if (isNumberMatrix(value)) return formatNumberMatrix(value);

	// { value: [...] } みたいな包みを軽く救う
	if (typeof value === "object") {
		const obj = value as any;
		if (isNumberArray(obj?.value)) return formatNumberSeries(obj.value);
		if (isNumberMatrix(obj?.value)) return formatNumberMatrix(obj.value);
		if (isNumberArray(obj?.output)) return formatNumberSeries(obj.output);
		if (isNumberMatrix(obj?.output)) return formatNumberMatrix(obj.output);
	}

	const json = safeStringify(value, 0);
	if (!json) return String(value);

	const max = 800;
	if (json.length > max) return json.slice(0, max) + "…";
	return json;
}
