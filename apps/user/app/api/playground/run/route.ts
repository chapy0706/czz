// apps/user/app/api/playground/run/route.ts
import { NextResponse } from "next/server";

import {
	PlaygroundRequestSchema,
	PlaygroundResponseSchema,
} from "@/lib/terminal/playgroundContract";

type Cmd = Record<string, unknown>;

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return !!v && typeof v === "object" && !Array.isArray(v);
}

function getTypeString(cmd: Cmd): string {
	const t = cmd.type;
	return typeof t === "string" ? t : "";
}

function getNumberParam(cmd: Cmd, keys: string[]): number | null {
	for (const k of keys) {
		const v = cmd[k];
		if (typeof v === "number") return v;
		if (typeof v === "string" && v.trim() !== "") {
			const n = Number(v);
			if (!Number.isNaN(n)) return n;
		}
	}
	return null;
}

function toCommands(input: unknown): Cmd[] {
	if (!Array.isArray(input)) return [];
	const out: Cmd[] = [];
	for (const v of input) {
		if (isPlainObject(v)) out.push(v);
	}
	return out;
}

function toNumbers(input: unknown): number[] {
	if (!Array.isArray(input)) return [];
	const out: number[] = [];
	for (const v of input) {
		if (typeof v === "number" && Number.isFinite(v)) out.push(v);
		if (typeof v === "string") {
			const n = Number(v);
			if (Number.isFinite(n)) out.push(n);
		}
	}
	return out;
}

function coerceCommands(submittedProgram: unknown): Cmd[] {
	// 期待: submittedProgram = { commands: [...] } みたいな形
	if (!isPlainObject(submittedProgram)) return [];
	const maybe = submittedProgram.commands;
	return toCommands(maybe);
}

function runPipeline(xs0: number[], commands: Cmd[]): number[] {
	let xs = [...xs0];

	for (const cmd of commands) {
		const t = getTypeString(cmd).toUpperCase();

		if (t.includes("SORT") || t.includes("ASC")) {
			xs.sort((a, b) => a - b);
			continue;
		}

		if (t.includes("DESC")) {
			xs.sort((a, b) => b - a);
			continue;
		}

		if (t.includes("REVERSE") || t === "REV") {
			xs.reverse();
			continue;
		}

		if (t.includes("UNIQUE") || t.includes("DEDUP") || t.includes("DISTINCT")) {
			const seen = new Set<number>();
			xs = xs.filter((n) => {
				if (seen.has(n)) return false;
				seen.add(n);
				return true;
			});
			continue;
		}

		if (t.includes("TAKE") || t.includes("HEAD") || t.includes("FIRST")) {
			const n = getNumberParam(cmd, ["n", "count", "take", "value"]) ?? 0;
			xs = xs.slice(0, Math.max(0, Math.min(50, Math.trunc(n))));
			continue;
		}

		if (t.includes("DROP") || t.includes("SKIP")) {
			const n = getNumberParam(cmd, ["n", "count", "drop", "value"]) ?? 0;
			xs = xs.slice(Math.max(0, Math.min(50, Math.trunc(n))));
			continue;
		}

		if (t.includes("ADD") || t.includes("PLUS")) {
			const k = getNumberParam(cmd, ["k", "add", "value", "n"]) ?? 0;
			xs = xs.map((x) => x + Math.trunc(k));
			continue;
		}

		if (t.includes("MUL") || t.includes("TIMES") || t.includes("MULTIPLY")) {
			const k = getNumberParam(cmd, ["k", "mul", "value", "n"]) ?? 1;
			xs = xs.map((x) => x * Math.trunc(k));
			// noUnnecessaryContinue 対策：ここは continue を置かない（末尾なので不要）
		}
	}

	return xs.slice(0, 50);
}

export async function POST(req: Request) {
	const json = await req.json().catch(() => null);
	const parsed = PlaygroundRequestSchema.safeParse(json);

	if (!parsed.success) {
		return NextResponse.json(
			PlaygroundResponseSchema.parse({
				ok: false,
				error: { message: "Invalid request", details: parsed.error.flatten() },
			}),
			{ status: 400 },
		);
	}

	try {
		// ✅ ここが今回のTSエラーの本丸：schemaに合わせる
		const { debugInput, submittedProgram } = parsed.data;

		const commands = coerceCommands(submittedProgram);
		const output = runPipeline(toNumbers(debugInput), commands);

		return NextResponse.json(
			PlaygroundResponseSchema.parse({
				ok: true,
				output,
			}),
		);
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Playground failed";
		return NextResponse.json(
			PlaygroundResponseSchema.parse({
				ok: false,
				error: { message, details: String(e) },
			}),
			{ status: 500 },
		);
	}
}
