// apps/user/src/lib/db.ts

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Drizzle の schema（テーブル定義）
// パスはプロジェクト構成に合わせて調整してください。
import * as schema from "../../../../infra/drizzle/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// node-postgres のコネクションプールを作成
const pool = new Pool({
  connectionString,
});

// Drizzle のクライアントを作成
export const db = drizzle(pool, { schema });

// 型として使いたい場合のエイリアス（任意）
export type DbClient = typeof db;
