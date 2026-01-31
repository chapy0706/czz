// apps/user/app/api/me/route.ts

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type MeResponse =
  | {
      ok: true;
      isSignedIn: false;
      user: null;
    }
  | {
      ok: true;
      isSignedIn: true;
      user: {
        userId: string;
        email: string | null;
        fullName: string | null;
        displayName: string | null;
        avatarUrl: string | null;
      };
    };

export async function GET() {
  const { isAuthenticated, userId } = await auth(); // ← ここがポイント :contentReference[oaicite:1]{index=1}

  // ゲスト（未ログイン）は 200 で返す（UX優先）
  if (!isAuthenticated || !userId) {
    const body: MeResponse = { ok: true, isSignedIn: false, user: null };
    return NextResponse.json(body, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  // 必要な情報だけ返す（userオブジェクト全部は返さない）
  const user = await currentUser(); // :contentReference[oaicite:2]{index=2}

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  const displayName =
    typeof user?.unsafeMetadata?.displayName === "string"
      ? user.unsafeMetadata.displayName
      : null;

  const body: MeResponse = {
    ok: true,
    isSignedIn: true,
    user: {
      userId,
      email,
      fullName: user?.fullName ?? null,
      displayName,
      avatarUrl: user?.imageUrl ?? null,
    },
  };

  return NextResponse.json(body, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
