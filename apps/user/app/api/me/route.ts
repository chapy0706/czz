// apps/user/app/api/me/route.ts
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

import { authServer } from "@/lib/auth/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

function pickDisplayName(input: { name?: string; email?: string }) {
  const name = (input.name ?? "").trim();
  if (name) return name;

  const email = (input.email ?? "").trim();
  if (email) return email;

  return "user";
}

type AppUserRow = {
  id: string;
  authUserId: string | null;
  displayName: string;
  role: number;
};

function rowsFromExecute(result: unknown): AppUserRow[] {
  // drizzle(node-postgres) は { rows: [...] } になりがち
  if (result && typeof result === "object" && "rows" in result) {
    return (result as any).rows as AppUserRow[];
  }
  // drizzle(postgres-js) は配列で返ることがある
  if (Array.isArray(result)) return result as AppUserRow[];
  return [];
}

export async function GET() {
  const { data, error } = await authServer.getSession();

  if (error || !data?.user) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  const authUserId = data.user.id;
  const displayName = pickDisplayName({
    name: data.user.name,
    email: data.user.email,
  });

  // まず既存を探す（auth_user_id は nullable なので、まずはこれで十分）
  const sel = await db.execute(sql`
    select
      id,
      auth_user_id as "authUserId",
      display_name as "displayName",
      role
    from users
    where auth_user_id = ${authUserId}
    limit 1
  `);

  const existing = rowsFromExecute(sel)[0];
  if (existing) {
    return NextResponse.json({
      isAuthenticated: true,
      authUser: {
        id: authUserId,
        email: data.user.email ?? null,
        name: data.user.name ?? null,
      },
      appUser: existing,
      db: { enabled: true, created: false },
    });
  }

  // なければ作る（role は default(0) でも良いが明示）
  const ins = await db.execute(sql`
    insert into users (auth_user_id, display_name, role)
    values (${authUserId}, ${displayName}, 0)
    returning
      id,
      auth_user_id as "authUserId",
      display_name as "displayName",
      role
  `);

  const inserted = rowsFromExecute(ins)[0];

  return NextResponse.json({
    isAuthenticated: true,
    authUser: {
      id: authUserId,
      email: data.user.email ?? null,
      name: data.user.name ?? null,
    },
    appUser: inserted ?? null,
    db: { enabled: true, created: true },
  });
}
