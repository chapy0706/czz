// e2e/tests/user-flow-top-to-result.spec.ts
import { type Page, expect, test } from "@playwright/test";

const TASK_ID =
	process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000202";

async function clickIfExists(page: Page, testId: string) {
	const loc = page.getByTestId(testId);
	if (await loc.count()) {
		await loc.first().click();
		return true;
	}
	return false;
}

async function ensureAtLeastOneCommand(page: Page) {
	const existing = page.locator('[data-testid-index="cmd-row-0"]');
	if (await existing.count()) return;

	const opened = await clickIfExists(page, "cb-add-open");
	if (!opened) return;

	const candidates = ["cb-add-MAP_ADD", "cb-add-FILTER_GT", "cb-add-SORT_ASC"];
	for (const id of candidates) {
		const ok = await clickIfExists(page, id);
		if (ok) break;
	}

	await expect(page.locator('[data-testid-index="cmd-row-0"]')).toHaveCount(1, {
		timeout: 10_000,
	});
}

async function clickRunEvenIfOverlay(page: Page) {
	// overlay が残って click を塞ぐことがあるので、最終手段で DOM click
	await page.evaluate(() => {
		const el = document.querySelector<HTMLButtonElement>(
			'[data-testid="cb-run"]',
		);
		el?.click();
	});
}

test.describe("User flow (task direct): Play → Run → Result", () => {
	test("can run to reach result (cb-result changes)", async ({ page }) => {
		await page.goto(`/tasks/${TASK_ID}`);
		await expect(page.getByTestId("command-builder")).toBeVisible({
			timeout: 10_000,
		});

		await ensureAtLeastOneCommand(page);

		// cb-result が存在する（あなたのUI契約）
		const cbResult = page.getByTestId("cb-result").first();
		await expect(cbResult).toBeVisible({ timeout: 10_000 });

		// 初期状態を取る（(no result) のはず）
		const before = await cbResult.innerText();

		// Run
		await clickRunEvenIfOverlay(page);

		// cb-result が変化するまで待つ
		await expect
			.poll(async () => await cbResult.innerText(), { timeout: 20_000 })
			.not.toBe(before);

		// 変化後、(no result) ではないこと（最低限）
		const after = await cbResult.innerText();
		expect(after).not.toContain("(no result)");
	});
});
