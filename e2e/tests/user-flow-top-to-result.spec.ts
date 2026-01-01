// e2e/tests/user-flow-top-to-result.spec.ts
import { expect, test } from "@playwright/test";

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000202";

async function clickIfVisibleEnabled(page: any, testId: string) {
  const loc = page.getByTestId(testId).first();
  if ((await loc.count()) === 0) return false;
  if (!(await loc.isVisible())) return false;
  if (!(await loc.isEnabled())) return false;
  await loc.click();
  return true;
}

function looksLikeEvaluateEndpoint(url: string): boolean {
  // “evaluate” を含む POST を待つ（後でURLが固まったら絞る）
  return url.includes("evaluate");
}

test.describe("User flow (task direct): Play → Run → Result", () => {
  test("can add a command and run to reach result (UI ResultPanel)", async ({ page }) => {
    await page.goto(`/tasks/${TASK_ID}`);

    await expect(page.getByTestId("command-builder")).toBeVisible();

    // コマンドを追加
    await page.getByTestId("cb-add-open").click();
    await page.getByTestId("cb-add-MAP_ADD").click();

    await expect(page.getByTestId("pipe-panel")).toBeVisible();
    await expect(page.getByTestId("cb-item-MAP_ADD")).toBeVisible();

    // 評価APIレスポンスを待つ（UI表示が遅れても“評価が走った”ことを保証）
    const waitEvaluate = page.waitForResponse(
      (res: any) => {
        const req = res.request();
        if (!req) return false;
        if (req.method() !== "POST") return false;
        const url = res.url();
        return looksLikeEvaluateEndpoint(url) && res.status() >= 200 && res.status() < 500;
      },
      { timeout: 20_000 }
    );

    // Run は CommandBuilder 側（terminal-run は触らない）
    const runClicked =
      (await clickIfVisibleEnabled(page, "cb-run")) ||
      (await clickIfVisibleEnabled(page, "evaluate-run")) ||
      (await clickIfVisibleEnabled(page, "run-button"));

    if (!runClicked) {
      // fallback: “Run/実行” のうち enabled を探す
      const btns = page.getByRole("button", { name: /run|実行/i });
      const count = await btns.count();
      let clicked = false;

      for (let i = 0; i < count; i++) {
        const b = btns.nth(i);
        if (await b.isVisible()) {
          const enabled = await b.isEnabled().catch(() => false);
          if (enabled) {
            await b.click();
            clicked = true;
            break;
          }
        }
      }

      if (!clicked) {
        throw new Error('Run button was not found (enabled). Ensure data-testid="cb-run" exists.');
      }
    }

    // まずAPIが返ったことを保証
    const res = await waitEvaluate;
    const status = res.status();
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(500);

    // UIとして ResultPanel が出ることを担保（今回の追加）
    await expect(page.getByTestId("result-panel")).toBeVisible();
    await expect(page.getByTestId("result-status")).toBeVisible();
    await expect(page.getByTestId("result-output")).toBeVisible();
  });
});
