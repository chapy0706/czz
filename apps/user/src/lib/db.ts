// apps/user/src/lib/db.ts
import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../../../infra/drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("Missing env: DATABASE_URL");

type GlobalDb = {
	__czzSql?: ReturnType<typeof postgres>;
	__czzDb?: ReturnType<typeof drizzle<typeof schema>>;
};

const g = globalThis as unknown as GlobalDb;

// Next.js dev での多重接続を避けるため singleton
export const sql = g.__czzSql ?? postgres(DATABASE_URL, { max: 1 });
g.__czzSql = sql;

// schema を渡して drizzle を型付け（ここが大事）
export const db = g.__czzDb ?? drizzle(sql, { schema });
g.__czzDb = db;

// route 側で必ずこの schema を使う
export { schema };
