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
  const direct = [cmd.type, cmd.commandType, cmd.kind, cmd.name, cmd.op];

  for (const c of direct) {
    if (typeof c === "string" && c.trim().length > 0) return c.trim();
  }

  // value の内側に type が入っているケースも拾う（CommandBuilder の value をそのまま並べているため）
  const value = (cmd as any).value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const nested = [
      (value as any).type,
      (value as any).commandType,
      (value as any).kind,
      (value as any).name,
      (value as any).op,
    ];
    for (const c of nested) {
      if (typeof c === "string" && c.trim().length > 0) return c.trim();
    }
  }

  return "";
}

function normalizeType(raw: string): string {
  // "sort-asc" / "sort_asc" / "SORT ASC" を同一視
  return raw
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getNumberParam(cmd: Cmd, keys: string[]): number | null {
  for (const k of keys) {
    const v = (cmd as any)[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)))
      return Number(v);
  }
  // よくある “value: { n: 3 }” も拾う
  const value = (cmd as any).value;
  if (isPlainObject(value)) {
    for (const k of keys) {
      const v = (value as any)[k];
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (
        typeof v === "string" &&
        v.trim() !== "" &&
        Number.isFinite(Number(v))
      )
        return Number(v);
    }
  }
  return null;
}

function coerceCommands(program: unknown): Cmd[] {
  if (!isPlainObject(program)) return [];
  const cmds = (program as any).commands;
  if (!Array.isArray(cmds)) return [];
  return cmds.filter(isPlainObject) as Cmd[];
}

function runPipeline(input: number[], commands: Cmd[]): number[] {
  let xs = [...input];

  for (const cmd of commands) {
    const t = normalizeType(getTypeString(cmd));
    if (!t) continue;

    // --- sort ---
    if (
      t.includes("SORT") ||
      t.includes("ORDER") ||
      t.includes("ASC") ||
      t.includes("DESC")
    ) {
      const isDesc = t.includes("DESC") || t.includes("DOWN");
      const isAsc =
        t.includes("ASC") ||
        t.includes("UP") ||
        (!isDesc && t.includes("SORT"));
      if (isAsc) xs.sort((a, b) => a - b);
      if (isDesc) xs.sort((a, b) => b - a);
      continue;
    }

    // --- reverse ---
    if (t.includes("REVERSE") || t === "REV") {
      xs.reverse();
      continue;
    }

    // --- unique / dedup ---
    if (t.includes("UNIQUE") || t.includes("DEDUP") || t.includes("DISTINCT")) {
      const seen = new Set<number>();
      xs = xs.filter((n) => (seen.has(n) ? false : (seen.add(n), true)));
      continue;
    }

    // --- take/head ---
    if (t.includes("TAKE") || t.includes("HEAD") || t.includes("FIRST")) {
      const n = getNumberParam(cmd, ["n", "count", "take", "value"]) ?? 0;
      xs = xs.slice(0, Math.max(0, Math.min(50, Math.trunc(n))));
      continue;
    }

    // --- drop/skip ---
    if (t.includes("DROP") || t.includes("SKIP")) {
      const n = getNumberParam(cmd, ["n", "count", "drop", "value"]) ?? 0;
      xs = xs.slice(Math.max(0, Math.min(50, Math.trunc(n))));
      continue;
    }

    // --- add ---
    if (t.includes("ADD") || t.includes("PLUS")) {
      const k = getNumberParam(cmd, ["k", "add", "value", "n"]) ?? 0;
      xs = xs.map((x) => x + Math.trunc(k));
      continue;
    }

    // --- multiply ---
    if (t.includes("MUL") || t.includes("TIMES") || t.includes("MULTIPLY")) {
      const k = getNumberParam(cmd, ["k", "mul", "value", "n"]) ?? 1;
      xs = xs.map((x) => x * Math.trunc(k));
      continue;
    }

    // 未対応コマンドは無視（Playground は “安全に試す” が主目的）
  }

  // 長すぎる表示を防ぐ
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
    const { debugInput, submittedProgram } = parsed.data;

    const commands = coerceCommands(submittedProgram);
    const output = runPipeline(debugInput, commands);

    return NextResponse.json(
      PlaygroundResponseSchema.parse({
        ok: true,
        output,
      }),
    );
  } catch (e: any) {
    return NextResponse.json(
      PlaygroundResponseSchema.parse({
        ok: false,
        error: {
          message: e?.message ?? "Playground failed",
          details: String(e),
        },
      }),
      { status: 500 },
    );
  }
}
