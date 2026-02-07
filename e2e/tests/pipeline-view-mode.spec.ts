// e2e/tests/pipeline-view-mode.spec.ts
import { expect, test } from "@playwright/test";
import {
	addCommandByType,
	clickByTestIdRobust,
	ensureAtLeastOneCommand,
	selectFirstCommandRow,
} from "./_helpers/ui";

const TASK_ID =
	process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000202";

test.describe("Pipeline view mode", () => {
	test("toggles compact/detailed views with a selected command", async ({
		page,
	}) => {
		await page.goto(`/tasks/${TASK_ID}`);
		await expect(page.getByTestId("command-builder")).toBeVisible({
			timeout: 10_000,
		});

		await ensureAtLeastOneCommand(page);
		if (await page.getByTestId("cb-add-open").count()) {
			await addCommandByType(page, "MAP_ADD");
		}

		await selectFirstCommandRow(page);

		await expect(
			page.locator('[data-testid="pipe-panel"]').first(),
		).toBeVisible({ timeout: 10_000 });

		// default compact
		await expect(page.getByTestId("pipe-compact-view")).toBeVisible({
			timeout: 10_000,
		});

		// detailed
		await clickByTestIdRobust(page, "pipe-view-detailed");
		await expect(page.getByTestId("pipe-strip")).toBeVisible({
			timeout: 10_000,
		});

		// back
		await clickByTestIdRobust(page, "pipe-view-compact");
		await expect(page.getByTestId("pipe-compact-view")).toBeVisible({
			timeout: 10_000,
		});
	});
});
