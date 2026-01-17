// apps/user/app/api/me/route.ts
import { authServer } from "@/lib/auth/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const { data, error } = await authServer.getSession();

  if (error || !data?.user) {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    isAuthenticated: true,
    authUser: {
      id: data.user.id,
      email: data.user.email ?? null,
      name: data.user.name ?? null,
    },
  });
}
