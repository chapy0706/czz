// apps/user/src/lib/db.ts

import "server-only";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Drizzle の schema（テーブル定義）
import * as schema from "../../../../infra/drizzle/schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __czz_pg_pool__: Pool | undefined;
  // eslint-disable-next-line no-var
  var __czz_drizzle_db__: DrizzleDb | undefined;
}

/**
 * Neon / Vercel Postgres は TLS 必須になりやすい。
 * node-postgres は `sslmode=require` を確実に解釈できないケースがあるので、
 * 接続文字列やホスト名から推測して `ssl` を明示する。
 */
function shouldUseSsl(connectionString: string): boolean {
  if (/sslmode=require/i.test(connectionString)) return true;
  if (/neon\.tech/i.test(connectionString)) return true;
  if (/vercel-storage/i.test(connectionString)) return true;
  return false;
}

function createPool(connectionString: string): Pool {
  const useSsl = shouldUseSsl(connectionString);

  return new Pool({
    connectionString,
    // Serverless での過剰コネクションを避けるため小さめに。
    max: Number(process.env.PG_POOL_MAX ?? 5),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
}

function getOrCreateDb(): DrizzleDb {
  if (globalThis.__czz_drizzle_db__) return globalThis.__czz_drizzle_db__;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // NOTE: import 時に落とすと Next build / Vercel build が巻き添えで落ちやすい。
    // 実際に DB を使うタイミングでエラーにするため、ここで投げる。
    throw new Error("DATABASE_URL is not set (set it in Vercel Environment Variables or .env.local)");
  }

  const pool = (globalThis.__czz_pg_pool__ ??= createPool(connectionString));
  const db = drizzle(pool, { schema });

  globalThis.__czz_drizzle_db__ = db;
  return db;
}

/**
 * `db.execute(...)` のような既存の呼び出しを壊さず、
 * 初回アクセス時にだけ DB を初期化するためのエクスポート。
 */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop, _receiver) {
    const real = getOrCreateDb() as any;
    const value = real[prop];
    return typeof value === "function" ? value.bind(real) : value;
  },
});

/** 型として使いたい場合のエイリアス */
export type DbClient = DrizzleDb;

/** 明示的に DB インスタンスを取得したい場合 */
export function getDb(): DrizzleDb {
  return getOrCreateDb();
}
