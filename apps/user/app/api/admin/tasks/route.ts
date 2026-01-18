// apps/user/app/api/admin/tasks/route.ts
import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  dslProgram: z.unknown(),
  testCases: z.unknown(),
  isPublished: z.boolean(),
});

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function sha256(s: string): string {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function requireAdminToken(req: Request): NextResponse | null {
  const expected = getRequiredEnv("ADMIN_API_TOKEN");
  const actual = req.headers.get("x-admin-token") ?? "";

  if (!actual || actual !== expected) {
    // 一時的な観測用（秘密は出さない）
    return NextResponse.json(
      {
        error: "unauthorized",
        debug: {
          expected: { len: expected.length, sha256: sha256(expected) },
          actual: { len: actual.length, sha256: sha256(actual) },
        },
      },
      { status: 401 },
    );
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const unauth = requireAdminToken(req);
    if (unauth) return unauth;

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { taskId: "dry-run", received: { title: parsed.data.title } },
      { status: 201 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
