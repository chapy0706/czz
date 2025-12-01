// apps/user/app/api/health/route.ts

import { db } from "@/lib/db"; // tsconfig の paths によっては相対パスでもOK
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // DB にシンプルなクエリを投げる
    const result = await db.execute(sql`select now()`);

    return NextResponse.json({
      status: "ok",
      db: "connected",
      time: result[0]?.now ?? null,
    });
  } catch (error) {
    console.error("DB health check failed", error);

    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
      },
      { status: 500 },
    );
  }
}
