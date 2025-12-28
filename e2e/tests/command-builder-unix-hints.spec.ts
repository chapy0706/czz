// e2e/tests/command-builder-unix-hints.spec.ts
import { expect, test } from "@playwright/test";

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000201";

test("command builder: shows unix hint (LPIC csv template) for MAP_ADD", async ({ page }) => {
  await page.goto(`/tasks/${TASK_ID}`);
  await expect(page.getByTestId("command-builder")).toBeVisible();

  await page.getByTestId("cb-add-open").click();
  await page.getByTestId("cb-add-MAP_ADD").click();

  const hint = page.getByTestId("cb-unix-hint-MAP_ADD");
  await expect(hint).toBeVisible();

  // 旧: stdin/stdout -> 新: input.csv/output.csv テンプレ
  await expect(hint).toContainText("tail -n +2 input.csv");
  await expect(hint).toContainText("cut -d, -f1");
  await expect(hint).toContainText("> output.csv");

  // 分解ステップも出しているなら、こっちを確認するとさらに堅い
  const steps = page.getByTestId("cb-unix-steps-MAP_ADD");
  await expect(steps).toBeVisible();
});
