// e2e/tests/pipeline-view-mode.spec.ts
import { expect, test } from "@playwright/test";

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000201";

test.describe("Pipeline view mode", () => {
  test("toggles compact/detailed views with a selected command", async ({ page }) => {
    await page.goto(`/tasks/${TASK_ID}`);
    await expect(page.getByTestId("command-builder")).toBeVisible();

    // コマンドを追加（前提を自前で作る）
    await page.getByTestId("cb-add-open").click();
    await page.getByTestId("cb-add-MAP_ADD").click();

    // PipelinePanel が見える
    await expect(page.getByTestId("pipe-panel")).toBeVisible();

    // Toggle が見える（A-6）
    await expect(page.getByTestId("pipe-view-toggle")).toBeVisible();

    // 追加したコマンドを type で確実に選択（index依存を排除）
    const mapAddRow = page.getByTestId("cb-item-MAP_ADD");
    await expect(mapAddRow).toBeVisible();
    await mapAddRow.click();

    // 詳細表示：strip が出る
    await page.getByTestId("pipe-view-detailed").click();
    await expect(page.getByTestId("pipe-strip")).toBeVisible();

    // 短い表示：compact view が出る
    await page.getByTestId("pipe-view-compact").click();
    await expect(page.getByTestId("pipe-compact-view")).toBeVisible();

    // 戻せる
    await page.getByTestId("pipe-view-detailed").click();
    await expect(page.getByTestId("pipe-strip")).toBeVisible();
  });
});
