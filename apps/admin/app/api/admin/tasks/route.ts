// apps/admin/app/api/admin/tasks/route.ts
import { NextResponse } from "next/server";

function getRequiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function buildUpstreamUrl(req: Request, path: string): string {
  const origin = getRequiredEnv("USER_APP_ORIGIN").replace(/\/$/, "");
  const url = new URL(req.url);
  const upstream = new URL(`${origin}${path}`);
  upstream.search = url.search;
  return upstream.toString();
}

async function forward(req: Request, method: "GET" | "POST") {
  const token = getRequiredEnv("USER_ADMIN_API_TOKEN");
  const upstreamUrl = buildUpstreamUrl(req, "/api/admin/tasks");

  const headers = new Headers();
  headers.set("accept", "application/json");
  headers.set("x-admin-token", token);
  if (method === "POST") headers.set("content-type", "application/json");

  const body = method === "POST" ? await req.text() : undefined;

  const res = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type":
        res.headers.get("content-type") ?? "application/json; charset=utf-8",
    },
  });
}

export async function GET(req: Request) {
  try {
    return await forward(req, "GET");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    return await forward(req, "POST");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
