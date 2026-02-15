// e2e/tests/pseudo-terminal.spec.ts
import { expect, test } from "@playwright/test";

const TASK_ID =
	process.env.E2E_TASK_ID ?? "00000000-0000-4000-8000-000000000201";

test.skip("debug drawer pseudo-terminal is removed; playground UI is now accordion", async ({
	page,
}) => {
	await page.goto(`/tasks/${TASK_ID}`);

	// DebugDrawer を開く
	const drawer = page.getByTestId("debug-drawer");
	await expect(drawer).toBeVisible();
	await drawer.locator("summary").click();

	// PseudoTerminal が見える
	await expect(page.getByTestId("pseudo-terminal")).toBeVisible();
	const input = page.getByTestId("terminal-input");
	await expect(input).toBeVisible();

	await input.fill("{ invalid json");
	await page.getByTestId("terminal-run").click();

	await expect(
		page.getByText(/ERR: input must be JSON/i).first(),
	).toBeVisible();

	await input.fill(":clear");
	await page.getByTestId("terminal-run").click();

	// ログがクリアされる（ERR文言が消える）
	await expect(page.getByText(/ERR: input must be JSON/i)).toHaveCount(0);
});
