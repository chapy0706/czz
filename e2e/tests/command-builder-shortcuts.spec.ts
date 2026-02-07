// e2e/tests/command-builder-shortcuts.spec.ts
import { expect, test } from "@playwright/test";
import {
	addCommandByType,
	clickByTestIdRobust,
	closeAnyOverlay,
	ensureAtLeastOneCommand,
} from "./_helpers/ui";

const TASK_ID =
	process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000202";

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

	// 追加UIがあるなら1件追加して「減った」が検証しやすい状態にする
	if (await page.getByTestId("cb-add-open").count()) {
		await addCommandByType(page, "MAP_ADD");
	}

	const rows = page.locator('[data-testid-index^="cmd-row-"]');
	const before = await rows.count();
	expect(before).toBeGreaterThan(0);

	// edit が開ける
	await expect(page.getByTestId("cmd-edit-0")).toBeVisible({ timeout: 10_000 });
	await clickByTestIdRobust(page, "cmd-edit-0");

	// 閉じる（escape）
	await closeAnyOverlay(page);

	// delete を押す
	await expect(page.getByTestId("cmd-del-0")).toBeVisible({ timeout: 10_000 });
	await clickByTestIdRobust(page, "cmd-del-0");

	// confirm があるUIもあるので Escape/Enter を軽く試す（害は少ない）
	await page.keyboard.press("Enter");
	await closeAnyOverlay(page);

	// 件数が減ることを待つ
	await expect
		.poll(async () => await rows.count(), { timeout: 10_000 })
		.toBe(before - 1);
});
