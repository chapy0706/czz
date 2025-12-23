import { expect, test } from "@playwright/test";

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000201";

test("command builder: shortcuts (E to edit, Delete to remove) work", async ({ page }) => {
  await page.goto(`/tasks/${TASK_ID}`);
  await expect(page.getByTestId("command-builder")).toBeVisible();

  // add MAP_ADD
  await page.getByTestId("cb-add-open").click();
  await page.getByTestId("cb-add-MAP_ADD").click();

  // 対象行（typeベース）を直接掴む
  const row = page.getByTestId("cb-item-MAP_ADD");
  await expect(row).toBeVisible();

  // 行を明示的にフォーカスしてからショートカット
  await expect(row).toHaveAttribute("aria-selected", "true");
  await row.press("e");
  const param = page.getByTestId("cb-param-value");
  await expect(param).toBeVisible();
  await param.fill("3");
  await page.getByTestId("cb-save").click();

  // JSON に反映
  const jsonPre = page.getByTestId("cb-json");
  await expect(jsonPre).toContainText('"type": "MAP_ADD"');
  await expect(jsonPre).toContainText('"value": 3');

  // Delete で削除（confirm を accept）
  // モーダルを閉じた後はフォーカスがずれることがあるので、もう一度行をクリック
  await row.click();
  page.once("dialog", (d) => d.accept());
  await expect(row).toHaveAttribute("aria-selected", "true");
  await row.press("Delete");

  // JSON から MAP_ADD が消えること
  await expect(jsonPre).not.toContainText('"type": "MAP_ADD"');
});
