// apps/user/src/lib/utils.ts

/**
 * `cn` は className を安全に連結するための小さなヘルパー。
 * 依存を増やさずにまず動かす版（shadcn/ui の cn と同等の用途）。
 *
 * - falsy は無視
 * - 配列は再帰的に平坦化
 * - { "class": boolean } 形式にも対応
 */
type ClassValue =
	| string
	| number
	| null
	| undefined
	| false
	| ClassValue[]
	| { [k: string]: boolean | undefined | null };

function flatten(input: ClassValue, out: string[]) {
	if (!input) return;

	if (typeof input === "string" || typeof input === "number") {
		out.push(String(input));
		return;
	}

	if (Array.isArray(input)) {
		for (const v of input) flatten(v, out);
		return;
	}

	if (typeof input === "object") {
		for (const [k, v] of Object.entries(input)) {
			if (v) out.push(k);
		}
	}
}

export function cn(...inputs: ClassValue[]): string {
	const out: string[] = [];
	for (const v of inputs) flatten(v, out);
	return out.join(" ");
}
