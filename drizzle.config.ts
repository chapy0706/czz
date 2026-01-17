// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config
 * - Neon/Vercel では `DATABASE_URL`（推奨: direct/unpooled）を使う
 * - ローカル開発では URL が未設定なら localhost へフォールバック
 *
 * NOTE:
 * - Neon は SSL 必須のため、URL 側に `sslmode=require` が付いていることを推奨
 * - secrets（URL）はログ出力しない
 */
const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.DB_URL ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL;

const localCredentials = {
  host: "localhost",
  port: 5433,
  user: "app",
  password: "app",
  database: "czz_dev",
  ssl: false,
};

export default defineConfig({
  dialect: "postgresql",
  schema: "./infra/drizzle/schema.ts",
  out: "./infra/drizzle/migrations",
  dbCredentials: databaseUrl ? { url: databaseUrl } : localCredentials,
  strict: true,
  verbose: true,
});
