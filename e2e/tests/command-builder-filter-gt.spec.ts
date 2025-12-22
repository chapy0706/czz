// e2e/tests/command-builder-filter-gt.spec.ts
import { expect, test } from "@playwright/test";

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000201";

test("command builder: FILTER_GT param form updates JSON and run returns result", async ({ page }) => {
  await page.goto(`/tasks/${TASK_ID}`);

  await expect(page.getByTestId("command-builder")).toBeVisible();

  // Add FILTER_GT
  await page.getByTestId("cb-add-open").click();
  await page.getByTestId("cb-add-FILTER_GT").click();

  // param input visible
  const paramInput = page.getByTestId("cb-param-value");
  await expect(paramInput).toBeVisible();

  // threshold/value を入れて保存
  await paramInput.fill("2");
  await page.getByTestId("cb-save").click();

  // JSON reflect
  const jsonPre = page.getByTestId("cb-json");
  await expect(jsonPre).toContainText('"type": "FILTER_GT"');
  await expect(jsonPre).toContainText('"value": 2');

  // Run
  await page.getByTestId("cb-run").click();

  const resultPre = page.getByTestId("cb-result");
  await expect(resultPre).toBeVisible();
  await expect(resultPre).not.toContainText("(no result)");
  await expect(resultPre).toContainText('"ok"');
});
