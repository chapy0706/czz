// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest が Playwright の spec を拾う事故を防ぐ
    exclude: [
      "**/e2e/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/playwright-report/**",
      "**/test-results/**",
    ],
  },
});
