// e2e/tests/command-builder-params.spec.ts
import { expect, test } from "@playwright/test";

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000201";

test("command builder: MAP_ADD param form updates JSON and run returns result", async ({ page }) => {
  await page.goto(`/tasks/${TASK_ID}`);

  // Builder が表示されている
  await expect(page.getByTestId("command-builder")).toBeVisible();

  // + Add command を開いて MAP_ADD を追加
  await page.getByTestId("cb-add-open").click();
  await page.getByTestId("cb-add-MAP_ADD").click();

  // 追加直後、Editor が開いて param 入力が見える（基本モード）
  const paramInput = page.getByTestId("cb-param-value");
  await expect(paramInput).toBeVisible();

  // value を入力して保存
  await paramInput.fill("3");
  await page.getByTestId("cb-save").click();

  // 生成 JSON に MAP_ADD + value が反映されている
  const jsonPre = page.getByTestId("cb-json");
  await expect(jsonPre).toBeVisible();
  await expect(jsonPre).toContainText('"type": "MAP_ADD"');
  await expect(jsonPre).toContainText('"value": 3');

  // Run して結果が返る（PASS/FAIL は固定しない）
  await page.getByTestId("cb-run").click();

  const resultPre = page.getByTestId("cb-result");
  await expect(resultPre).toBeVisible();

  // (no result) から変化していること
  await expect(resultPre).not.toContainText("(no result)");

  // EvaluateResponse の ok が含まれること（成功/失敗どちらでも良い）
  await expect(resultPre).toContainText('"ok"');
});
