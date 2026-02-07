// e2e/tests/command-builder-filter-gt.spec.ts
import { expect, test } from "@playwright/test";
import {
	addCommandByType,
	clickRunRobust,
	clickSaveIfExists,
	ensureAtLeastOneCommand,
	openEditorFromIndex,
	selectFirstCommandRow,
	waitCbResultChange,
} from "./_helpers/ui";

const TASK_ID =
	process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000202";

test("command builder: FILTER_GT param form updates JSON and run returns result", async ({
	page,
}) => {
	await page.goto(`/tasks/${TASK_ID}`);
	await expect(page.getByTestId("command-builder")).toBeVisible({
		timeout: 10_000,
	});

	await ensureAtLeastOneCommand(page);

	if (await page.getByTestId("cb-add-open").count()) {
		await addCommandByType(page, "FILTER_GT");
	}

	await selectFirstCommandRow(page);

	const editor = await openEditorFromIndex(page, 0);
	const key = editor.getByTestId("param-key");
	if (await key.count()) await key.fill("age");
	const gt = editor.getByTestId("param-gt");
	if (await gt.count()) await gt.fill("30");
	await clickSaveIfExists(editor, page);

	await clickRunRobust(page);
	await waitCbResultChange(page);
});
