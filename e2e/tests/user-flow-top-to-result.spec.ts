// e2e/tests/user-flow-top-to-result.spec.ts
import { expect, test } from "@playwright/test";
import {
	clickRunRobust,
	ensureAtLeastOneCommand,
	waitCbResultChange,
} from "./_helpers/ui";

const TASK_ID =
	process.env.E2E_TASK_ID ?? "00000000-0000-4000-8000-000000000201";

test.describe("User flow (task direct): Play → Run → Result", () => {
	test("can run to reach result (cb-result changes)", async ({ page }) => {
		await page.goto(`/tasks/${TASK_ID}`);
		await expect(page.getByTestId("command-builder")).toBeVisible({
			timeout: 10_000,
		});

		await ensureAtLeastOneCommand(page);

		// Run
		await clickRunRobust(page);
		await waitCbResultChange(page);
	});
});
