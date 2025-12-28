// e2e/tests/command-builder-shortcuts.spec.ts
import { expect, test } from "@playwright/test";

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000201";

async function selectAndFocusRow(row: ReturnType<import("@playwright/test").Page["getByTestId"]>) {
  await expect(row).toBeVisible();
  await row.scrollIntoViewIfNeeded();

  // まずは force click（actionability を無視して発火）
  try {
    await row.click({ force: true });
  } catch {
    // それでも落ちるなら programmatic click（DOMクリック）に切り替える
    await row.evaluate((el) => (el as HTMLElement).click());
  }

  // focus も念のため programmatic に寄せる（安定）
  await row.evaluate((el) => (el as HTMLElement).focus());
  await expect(row).toBeFocused();
}

test("command builder: shortcuts (E to edit, Delete to remove) work", async ({ page }) => {
  await page.goto(`/tasks/${TASK_ID}`);
  await expect(page.getByTestId("command-builder")).toBeVisible();

  // add MAP_ADD
  await page.getByTestId("cb-add-open").click();
  await page.getByTestId("cb-add-MAP_ADD").click();

  const row = page.getByTestId("cb-item-MAP_ADD");
  await selectAndFocusRow(row);

  // E で編集
  await page.keyboard.press("e");
  const param = page.getByTestId("cb-param-value");
  await expect(param).toBeVisible();
  await param.fill("3");
  await page.getByTestId("cb-save").click();

  // JSON に反映
  const jsonPre = page.getByTestId("cb-json");
  await expect(jsonPre).toContainText('"type": "MAP_ADD"');
  await expect(jsonPre).toContainText('"value": 3');

  // Delete で削除（confirm を accept）
  await selectAndFocusRow(row);
  page.once("dialog", (d) => d.accept());
  await page.keyboard.press("Delete");

  await expect(jsonPre).not.toContainText('"type": "MAP_ADD"');
});
