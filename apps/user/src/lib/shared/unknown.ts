// apps/user/src/lib/shared/unknown.ts

export type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === "object" && value !== null;
}

export function getString(
	record: UnknownRecord | null | undefined,
	key: string,
): string | undefined {
	if (!record) return undefined;
	const value = record[key];
	return typeof value === "string" ? value : undefined;
}

export function getNumber(
	record: UnknownRecord | null | undefined,
	key: string,
): number | undefined {
	if (!record) return undefined;
	const value = record[key];
	return typeof value === "number" ? value : undefined;
}

export function getBoolean(
	record: UnknownRecord | null | undefined,
	key: string,
): boolean | undefined {
	if (!record) return undefined;
	const value = record[key];
	return typeof value === "boolean" ? value : undefined;
}

export function getArray(
	record: UnknownRecord | null | undefined,
	key: string,
): unknown[] | undefined {
	if (!record) return undefined;
	const value = record[key];
	return Array.isArray(value) ? value : undefined;
}
