// e2e/tests/command-builder-shortcuts.spec.ts
import { expect, test } from "@playwright/test";
import {
	addCommandByType,
	ensureAtLeastOneCommand,
	openEditorFromIndex,
} from "./_helpers/ui";

const TASK_ID =
	process.env.E2E_TASK_ID ?? "00000000-0000-4000-8000-000000000201";

/**
 * リファクタ中は「0件になる」までを契約にすると seed / 初期状態で壊れやすい。
 * ここでは “削除操作で件数が減る” を契約にする。
 */
test("command builder: edit/remove controls work (stable contract)", async ({
	page,
}) => {
	await page.goto(`/tasks/${TASK_ID}`);
	await expect(page.getByTestId("command-builder")).toBeVisible({
		timeout: 10_000,
	});

	// 初期状態がどうであれ、最低1件ある状態にする
	await ensureAtLeastOneCommand(page);

	// 1件追加して「減った」が検証しやすい状態にする
	await addCommandByType(page, "MAP_ADD");

	const rows = page.locator('[data-testid-index^="cmd-row-"]');
	const before = await rows.count();
	expect(before).toBeGreaterThan(0);

	// edit が開ける
	const editor = await openEditorFromIndex(page, 0);
	const del = editor.getByTestId("cmd-delete");
	await expect(del).toBeVisible({ timeout: 10_000 });
	page.once("dialog", (dialog) => dialog.accept());
	await del.click({ force: true });

	// confirm があるUIもあるので Escape/Enter を軽く試す（害は少ない）
	await page.keyboard.press("Enter");

	// 件数が減ることを待つ
	await expect
		.poll(async () => await rows.count(), { timeout: 10_000 })
		.toBe(before - 1);
});
