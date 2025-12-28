// e2e/tests/command-builder-params.spec.ts
import { expect, test } from "@playwright/test";

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000201";

async function forceClick(locator: any) {
  await locator.scrollIntoViewIfNeeded();
  try {
    await locator.click({ force: true });
  } catch {
    await locator.evaluate((el: HTMLElement) => el.click());
  }
}

async function addCommand(page: any, type: string) {
  // popover残り対策
  await page.keyboard.press("Escape").catch(() => {});
  const open = page.getByTestId("cb-add-open");
  await expect(open).toBeVisible();

  await forceClick(open);

  const item = page.getByTestId(`cb-add-${type}`);
  await expect(item).toBeVisible();
  await forceClick(item);

  // 念のため閉じる（残留すると次の操作が死ぬ）
  await page.keyboard.press("Escape").catch(() => {});
  await expect(page.getByTestId(`cb-item-${type}`)).toBeVisible();
}

test("command builder: MAP_ADD param form updates JSON and run returns result", async ({ page }) => {
  await page.goto(`/tasks/${TASK_ID}`);
  await expect(page.getByTestId("command-builder")).toBeVisible();

  await addCommand(page, "MAP_ADD");

  const row = page.getByTestId("cb-item-MAP_ADD");
  await expect(row).toBeVisible();

  // 選択だけ（編集はショートカットで開く）
  await row.evaluate((el: HTMLElement) => el.click());
  await page.keyboard.press("e");

  const param = page.getByTestId("cb-param-value");
  await expect(param).toBeVisible();
  await param.fill("3");
  await page.getByTestId("cb-save").click();

  const jsonPre = page.getByTestId("cb-json");
  await expect(jsonPre).toContainText('"type": "MAP_ADD"');
  await expect(jsonPre).toContainText('"value": 3');

  await page.getByTestId("cb-run").click();

  // “run returns result” の最低保証（OK/NGどちらでも結果が返る形になっている前提）
  await expect(page.getByTestId("cb-result")).not.toContainText("(no result)");
});
