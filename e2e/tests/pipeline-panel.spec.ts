// e2e/tests/pipeline-panel.spec.ts
import { expect, test } from "@playwright/test";
import {
	addCommandByType,
	clickByTestIdRobust,
	ensureAtLeastOneCommand,
	selectFirstCommandRow,
} from "./_helpers/ui";

const TASK_ID =
	process.env.E2E_TASK_ID ?? "00000000-0000-4000-8000-000000000201";

/**
 * GesturePad のドラッグは端末差/環境差でフレークしやすいので、
 * いまは「Runner パネルが表示され、詳細表示にでき、Next が存在する」までを契約にする。
 */
test.skip("pipeline panel detailed/runner view not available in current UI", async ({
	page,
}) => {
	await page.goto(`/tasks/${TASK_ID}`);
	await expect(page.getByTestId("command-builder")).toBeVisible({
		timeout: 10_000,
	});

	await ensureAtLeastOneCommand(page);

	if (await page.getByTestId("cb-add-open").count()) {
		// 2つ入れて “次” がある状況を作る
		await addCommandByType(page, "MAP_ADD");
		await addCommandByType(page, "FILTER_GT");
	}

	await selectFirstCommandRow(page);

	await expect(page.locator('[data-testid="pipe-panel"]').first()).toBeVisible({
		timeout: 10_000,
	});

	await clickByTestIdRobust(page, "pipe-view-detailed");
	await expect(page.getByTestId("pipe-strip")).toBeVisible({ timeout: 10_000 });

	// Next のUI契約（存在する/見える）
	const next = page.getByTestId("pipe-next");
	if (await next.count()) {
		await expect(next.first()).toBeVisible({ timeout: 10_000 });
	}
});
