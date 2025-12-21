// apps/user/src/lib/terminal/guestUserId.ts
"use client";

const KEY = "czz-guest-user-id";

export function getOrCreateGuestUserId(): string {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000000";

  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(KEY, id);
  return id;
}
