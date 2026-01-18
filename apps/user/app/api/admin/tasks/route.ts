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

function debugToken(label: string, v: string | null | undefined) {
  const value = v ?? "";
  console.log(
    `[admin/tasks] ${label}.len=${value.length} sha256=${sha256(value)}`,
  );
}

function requireAdminToken(req: Request): NextResponse | null {
  const expected = getRequiredEnv("ADMIN_API_TOKEN");
  const actual = req.headers.get("x-admin-token");

  // 秘密を漏らさない形で比較材料だけログに出す
  debugToken("expected", expected);
  debugToken("actual", actual);

  if (!actual || actual !== expected) {
    console.warn("[admin/tasks] unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function POST(req: Request) {
  try {
    console.log("[admin/tasks] POST called");

    const unauth = requireAdminToken(req);
    if (unauth) return unauth;

    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      console.warn("[admin/tasks] invalid body", parsed.error.flatten());
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
    console.error("[admin/tasks] exception", message, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
