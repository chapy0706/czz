// e2e/tests/pipeline-panel.spec.ts
import { expect, test } from "@playwright/test";

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000201";

async function addCommand(page: any, type: string) {
  // まず残ってるUIを閉じる
  await page.keyboard.press("Escape").catch(() => {});

  const open = page.getByTestId("cb-add-open");
  await expect(open).toBeVisible();
  await open.evaluate((el: HTMLElement) => el.click());

  const item = page.getByTestId(`cb-add-${type}`);
  await expect(item).toBeVisible();
  await item.evaluate((el: HTMLElement) => el.click());

  // popover残留対策
  await page.keyboard.press("Escape").catch(() => {});
  await expect(page.getByTestId(`cb-item-${type}`)).toBeVisible();
}

test("pipeline panel: +Step/-Step reveals pipeline step-by-step and Next moves selection", async ({ page }) => {
  await page.goto(`/tasks/${TASK_ID}`);
  await expect(page.getByTestId("command-builder")).toBeVisible();
  await expect(page.getByTestId("pipe-panel")).toBeVisible();

  await addCommand(page, "MAP_ADD");
  await addCommand(page, "SORT_ASC");
  await addCommand(page, "OUTPUT_FIRST");

  const firstRow = page.getByTestId("cb-item-MAP_ADD");
  await expect(firstRow).toBeVisible();
  await firstRow.evaluate((el: HTMLElement) => el.click());

  await expect(page.getByTestId("pipe-step-0")).toBeVisible();
  await expect(page.getByTestId("pipe-step-1")).not.toBeVisible();

  await page.getByTestId("pipe-step-plus").click();
  await expect(page.getByTestId("pipe-step-1")).toBeVisible();

  await page.getByTestId("pipe-step-minus").click();
  await expect(page.getByTestId("pipe-step-1")).not.toBeVisible();

  await page.getByTestId("pipe-step-plus").click();
  await page.getByTestId("pipe-next").click();

  const secondRow = page.getByTestId("cb-item-SORT_ASC");
  await expect(secondRow).toBeVisible();
  await expect(secondRow).toHaveAttribute("aria-selected", "true");
});
