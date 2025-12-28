// e2e/tests/pipeline-panel.spec.ts
import { expect, test } from "@playwright/test";

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000201";

async function safeClick(locator: any) {
  await locator.scrollIntoViewIfNeeded();
  try {
    await locator.click({ force: true });
  } catch {
    await locator.evaluate((el: HTMLElement) => el.click());
  }
}

test("pipeline panel: +Step/-Step reveals pipeline step-by-step and Next moves selection", async ({ page }) => {
  await page.goto(`/tasks/${TASK_ID}`);
  await expect(page.getByTestId("command-builder")).toBeVisible();
  await expect(page.getByTestId("pipe-panel")).toBeVisible();

  const addOpen = page.getByTestId("cb-add-open");

  async function addCommand(type: string) {
    // open palette
    await safeClick(addOpen);

    // click item
    const item = page.getByTestId(`cb-add-${type}`);
    await expect(item).toBeVisible();
    await safeClick(item);

    // popover が残ってると次の click が死ぬので閉じる（保険）
    await page.keyboard.press("Escape").catch(() => {});

    // 追加された行が見えるまで待つ
    await expect(page.getByTestId(`cb-item-${type}`)).toBeVisible();
  }

  // コマンドを3つ追加
  await addCommand("MAP_ADD");
  await addCommand("SORT_ASC");
  await addCommand("OUTPUT_FIRST");

  // 先頭コマンドを選択（swipe/dndの都合で programmatic に寄せる）
  const firstRow = page.getByTestId("cb-item-MAP_ADD");
  await firstRow.evaluate((el: HTMLElement) => el.click());

  // 選択起点で 1 段だけ見える
  await expect(page.getByTestId("pipe-step-0")).toBeVisible();
  await expect(page.getByTestId("pipe-step-1")).not.toBeVisible();

  // +Step で増える
  await page.getByTestId("pipe-step-plus").click();
  await expect(page.getByTestId("pipe-step-1")).toBeVisible();

  // -Step で戻る
  await page.getByTestId("pipe-step-minus").click();
  await expect(page.getByTestId("pipe-step-1")).not.toBeVisible();

  // 次へ（Next）
  await page.getByTestId("pipe-step-plus").click();
  await page.getByTestId("pipe-next").click();

  const secondRow = page.getByTestId("cb-item-SORT_ASC");
  await expect(secondRow).toBeVisible();
  await expect(secondRow).toHaveAttribute("aria-selected", "true");
});
