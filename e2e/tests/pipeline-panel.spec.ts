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

  // 初期表示：step0 だけ
  await expect(page.getByTestId("pipe-step-0")).toBeVisible();
  await expect(page.getByTestId("pipe-step-1")).not.toBeVisible();

  // +Step で step1 が出る
  await page.getByTestId("pipe-step-plus").click();
  await expect(page.getByTestId("pipe-step-1")).toBeVisible();

  // -Step で step1 が消える（※ 選択が MAP_ADD のままのときに検証する）
  await page.getByTestId("pipe-step-minus").click();
  await expect(page.getByTestId("pipe-step-1")).not.toBeVisible();

  // もう一度 +Step
  await page.getByTestId("pipe-step-plus").click();
  await expect(page.getByTestId("pipe-step-1")).toBeVisible();

  // Next で “いま表示されている次の段” に選択が移る（SORT_ASC）
  await page.getByTestId("pipe-next").click();
  const sortRow = page.getByTestId("cb-item-SORT_ASC");
  await expect(sortRow).toBeVisible();
  await expect(sortRow).toHaveAttribute("aria-selected", "true");

  // Step タップでの選択移動も確認（MAP_ADD に戻してから）
  await firstRow.evaluate((el: HTMLElement) => el.click());
  await page.getByTestId("pipe-step-plus").click();
  await expect(page.getByTestId("pipe-step-1")).toBeVisible();

  await page.getByTestId("pipe-step-1").evaluate((el: HTMLElement) => el.click());
  await expect(sortRow).toHaveAttribute("aria-selected", "true");
});
