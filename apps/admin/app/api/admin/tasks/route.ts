// apps/user/app/api/admin/tasks/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const CreateTaskBodySchema = z.object({
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

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function requireAdminToken(req: Request): NextResponse | null {
  const expected = getRequiredEnv("ADMIN_API_TOKEN");
  const actual = req.headers.get("x-admin-token");
  if (!actual || actual !== expected) return unauthorized();
  return null;
}

/**
 * トークン疎通チェック用（デバッグのため）
 * - 200: トークンOK
 * - 401: トークンNG
 */
export async function GET(req: Request) {
  try {
    const unauth = requireAdminToken(req);
    if (unauth) return unauth;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * 課題作成（最小）
 * ここでは DB 永続化ロジックはまだ繋がない。まず疎通とバリデーションを確立する。
 * 次のステップで UseCase/Repository を呼ぶ。
 */
export async function POST(req: Request) {
  try {
    const unauth = requireAdminToken(req);
    if (unauth) return unauth;

    const json = await req.json().catch(() => null);
    const parsed = CreateTaskBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // まずは疎通優先：DBには入れず、受け取った内容を要約して返す
    // DB接続が絡むと切り分けが遅くなるので、段階を分ける。
    const { title, description, isPublished } = parsed.data;

    return NextResponse.json(
      {
        taskId: "dry-run",
        received: { title, description, isPublished },
      },
      { status: 201 },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
