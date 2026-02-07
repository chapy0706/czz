// e2e/playwright.config.ts
import { defineConfig } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3100";

export default defineConfig({
	testDir: "./tests",
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	use: {
		// biome-ignore lint/style/useNamingConvention: Playwright config requires `baseURL`
		baseURL: baseUrl,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
});
