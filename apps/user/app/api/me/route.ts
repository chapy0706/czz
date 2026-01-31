// apps/user/app/api/me/route.ts

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type MeResponse =
  | { ok: true; isSignedIn: false; user: null }
  | {
      ok: true;
      isSignedIn: true;
      user: {
        userId: string;
        email: string | null;
        fullName: string | null;
        displayName: string | null;
        avatarUrl: string | null; // ← ここが「選んだ画像」を返す
      };
    };

export async function GET() {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    const body: MeResponse = { ok: true, isSignedIn: false, user: null };
    return NextResponse.json(body, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const user = await currentUser();

  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;

  const displayName =
    typeof user?.unsafeMetadata?.displayName === "string"
      ? user.unsafeMetadata.displayName
      : null;

  const avatarFromMeta =
    typeof user?.unsafeMetadata?.avatar === "string" &&
    user.unsafeMetadata.avatar.startsWith("/")
      ? user.unsafeMetadata.avatar
      : null;

  const body: MeResponse = {
    ok: true,
    isSignedIn: true,
    user: {
      userId,
      email,
      fullName: user?.fullName ?? null,
      displayName,
      avatarUrl: avatarFromMeta ?? user?.imageUrl ?? null,
    },
  };

  return NextResponse.json(body, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
