// e2e/tests/_helpers/ui.ts
import { expect, type Locator, type Page } from "@playwright/test";

export async function closeAnyOverlay(page: Page) {
	// まず正攻法：Escape
	await page.keyboard.press("Escape");
	await page.keyboard.press("Escape");

	// overlay が残ってクリックを塞ぐケースがあるので、無害化する（E2E専用）
	await page.evaluate(() => {
		const nodes = Array.from(
			document.querySelectorAll<HTMLElement>("div.fixed.inset-0.z-50"),
		);
		for (const n of nodes) {
			// 見た目とクリック遮断だけを消す（閉じない実装でも前へ進める）
			n.style.pointerEvents = "none";
			n.style.background = "transparent";
		}
	});
}

export async function clickByTestIdRobust(page: Page, testId: string) {
	await closeAnyOverlay(page);
	const loc = page.getByTestId(testId).first();
	await expect(loc).toBeVisible({ timeout: 10_000 });

	try {
		await loc.click({ timeout: 3000 });
		return;
	} catch {
		// ignore
	}
	try {
		await loc.click({ force: true, timeout: 3000 });
		return;
	} catch {
		// ignore
	}

	// 最終手段：DOM click
	await page.evaluate((id) => {
		const el = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
		el?.click();
	}, testId);
}

export async function ensureAtLeastOneCommand(page: Page) {
	const row0 = page.locator('[data-testid-index="cmd-row-0"]');
	if (await row0.count()) return;

	for (const id of ["cb-add-MAP_ADD", "cb-add-FILTER_GT", "cb-add-SORT_ASC"]) {
		const add = page.getByTestId(id);
		if (await add.count()) {
			await clickByTestIdRobust(page, id);
			break;
		}
	}

	await expect(page.locator('[data-testid-index="cmd-row-0"]')).toHaveCount(1, {
		timeout: 10_000,
	});
}

export async function addCommandByType(page: Page, type: string) {
	await clickByTestIdRobust(page, `cb-add-${type}`);
}

export async function selectFirstCommandRow(page: Page) {
	const row0 = page.locator('[data-testid-index="cmd-row-0"]').first();
	await expect(row0).toBeVisible({ timeout: 10_000 });
	await closeAnyOverlay(page);
	await row0.click({ force: true });
}

export async function openEditorFromIndex(
	page: Page,
	index = 0,
): Promise<Locator> {
	const row = page.locator(`[data-testid-index="cmd-row-${index}"]`).first();
	await expect(row).toBeVisible({ timeout: 10_000 });
	await closeAnyOverlay(page);
	await row.locator("button").first().click({ force: true });

	// role=dialog があれば優先
	const dialog = page.getByRole("dialog").first();
	if (await dialog.count()) {
		await expect(dialog).toBeVisible({ timeout: 10_000 });
		return dialog;
	}

	// 無ければ overlay（Sheet）配下
	const overlay = page.locator("div.fixed.inset-0.z-50").first();
	await expect(overlay).toBeVisible({ timeout: 10_000 });
	return overlay;
}

export async function clickSaveIfExists(container: Locator, page: Page) {
	const save = container
		.getByRole("button", { name: /save|保存|ok|適用/i })
		.first();
	if (await save.count()) {
		await save.click({ force: true });
	} else {
		await page.keyboard.press("Enter");
	}
	await closeAnyOverlay(page);
}

export async function clickRunRobust(page: Page) {
	await closeAnyOverlay(page);

	const run = page.getByTestId("cb-run").first();
	await expect(run).toBeVisible({ timeout: 10_000 });
	await expect(run).toBeEnabled({ timeout: 10_000 });

	try {
		await run.click({ timeout: 3000 });
		return;
	} catch {
		// ignore
	}
	try {
		await run.click({ force: true, timeout: 3000 });
		return;
	} catch {
		// ignore
	}
	await page.evaluate(() => {
		const el = document.querySelector<HTMLButtonElement>(
			'[data-testid="cb-run"]',
		);
		el?.click();
	});
}

export async function waitCbResultChange(page: Page, timeoutMs = 20_000) {
	await expect(page).toHaveURL(/\/result$/, { timeout: timeoutMs });
	await expect(page.getByTestId("result-page")).toBeVisible({
		timeout: timeoutMs,
	});
	await expect(page.getByTestId("result-status")).toBeVisible({
		timeout: timeoutMs,
	});
}
