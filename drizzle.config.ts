// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./infra/drizzle/schema.ts",
  out: "./infra/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: "localhost",      // Docker Compose で 5432:5432 を公開している
    port: 5433,
    user: "app",
    password: "app",
    database: "czz_dev",
    ssl: false,             // ★ ここがポイント：ローカルでは SSL を明示的に OFF
  },
});
