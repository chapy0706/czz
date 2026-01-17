// apps/user/app/api/auth/[...path]/route.ts
import { authApiHandler } from "@neondatabase/auth/next/server";

export const { GET, POST } = authApiHandler();
