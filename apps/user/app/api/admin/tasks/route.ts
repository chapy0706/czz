// apps/user/app/api/admin/tasks/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * 切り分け用の安全設定
 * - edge ではなく nodejs で確実に動かす
 */
export const runtime = "nodejs";

/**
 * リクエストボディ（最小）
 */
const BodySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  dslProgram: z.unknown(),
  testCases: z.unknown(),
  isPublished: z.boolean(),
});

/**
 * 必須 env を安全に読む
 */
function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

/**
 * 管理用トークン認証
 */
function requireAdminToken(req: Request): NextResponse | null {
  const expected = getRequiredEnv("ADMIN_API_TOKEN");
  const actual = req.headers.get("x-admin-token");

  if (!actual || actual !== expected) {
    console.warn("[admin/tasks] unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * POST /api/admin/tasks
 * いまは DB に触らない dry-run
 */
export async function POST(req: Request) {
  try {
    console.log("[admin/tasks] POST called");

    // 認証
    const unauth = requireAdminToken(req);
    if (unauth) return unauth;

    // JSON パース
    const json = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(json);

    if (!parsed.success) {
      console.warn("[admin/tasks] invalid body", parsed.error.flatten());
      return NextResponse.json(
        { error: "invalid_body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // ここでは永続化しない（切り分け優先）
    console.log("[admin/tasks] dry-run success");

    return NextResponse.json(
      {
        taskId: "dry-run",
        received: {
          title: parsed.data.title,
          isPublished: parsed.data.isPublished,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[admin/tasks] exception", message, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
