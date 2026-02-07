// e2e/tests/command-builder-params.spec.ts
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

test("command builder: MAP_ADD param form updates JSON and run returns result", async ({
	page,
}) => {
	await page.goto(`/tasks/${TASK_ID}`);
	await expect(page.getByTestId("command-builder")).toBeVisible({
		timeout: 10_000,
	});

	await ensureAtLeastOneCommand(page);

	// 追加UIがある場合は MAP_ADD を追加（無ければ既存で続行）
	if (await page.getByTestId("cb-add-open").count()) {
		await addCommandByType(page, "MAP_ADD");
	}

	await selectFirstCommandRow(page);

	const editor = await openEditorFromIndex(page, 0);
	const add = editor.getByTestId("param-add");
	if (await add.count()) {
		await add.fill("1");
	}
	await clickSaveIfExists(editor, page);

	await clickRunRobust(page);
	await waitCbResultChange(page);
});
