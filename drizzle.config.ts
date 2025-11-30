// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./infra/drizzle/schema.ts",
  out: "./infra/drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: "app",
    password: "app",
    database: "czz_dev",
  },
});
