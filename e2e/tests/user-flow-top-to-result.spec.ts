// e2e/tests/user-flow-top-to-result.spec.ts
import { expect, test } from "@playwright/test";

/**
 * ユーザー導線（暫定版）
 * 現状 Top / Tasks 一覧が未実装でも、核の体験（Play→Run→Result）を守る。
 *
 * 起点：/tasks/:id
 * 手順：コマンド追加 → Run → （評価APIレスポンス受信 = Result到達）
 *
 * NOTE:
 * - UI の Result 表示 testid が未確定でも落ちないよう、まずは API を “真実” にする。
 * - 後で Result UI が固まったら、ここに 1 行だけ `getByTestId("result-...")` を足して強化できる。
 */

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000202";

async function clickIfVisible(page: any, testId: string) {
  const loc = page.getByTestId(testId);
  if ((await loc.count()) > 0) {
    await loc.first().click();
    return true;
  }
  return false;
}

function looksLikeEvaluateEndpoint(url: string): boolean {
  // ここは “当たりを広く取る” 方針（後で固めたら絞る）
  const patterns = [
    "/evaluate",
    "/api/evaluate",
    "/api/terminal",
    "/api/terminal/evaluate",
    "/api/tasks",
  ];
  return patterns.some((p) => url.includes(p)) && url.includes("evaluate");
}

test.describe("User flow (task direct): Play → Run → Result", () => {
  test("can add a command and run to reach result (via evaluate API)", async ({ page }) => {
    await page.goto(`/tasks/${TASK_ID}`);

    // Play 画面（Command Builder）が出る
    await expect(page.getByTestId("command-builder")).toBeVisible();

    // コマンド追加（MAP_ADD を1つ入れる）
    await expect(page.getByTestId("cb-add-open")).toBeVisible();
    await page.getByTestId("cb-add-open").click();
    await expect(page.getByTestId("cb-add-MAP_ADD")).toBeVisible();
    await page.getByTestId("cb-add-MAP_ADD").click();

    // PipelinePanel が表示される（A-6）
    await expect(page.getByTestId("pipe-panel")).toBeVisible();

    // 追加したコマンドがリストに出る（typeで掴む）
    const mapAddRow = page.getByTestId("cb-item-MAP_ADD");
    await expect(mapAddRow).toBeVisible();

    // ===== ここが本丸：Run 押下後に “評価APIレスポンス” を待つ =====
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

    // Run（testid候補 → fallback）
    const runClicked =
      (await clickIfVisible(page, "terminal-run")) ||
      (await clickIfVisible(page, "cb-run")) ||
      (await clickIfVisible(page, "run-button")) ||
      (await clickIfVisible(page, "evaluate-run")) ||
      (await clickIfVisible(page, "pt-run"));

    if (!runClicked) {
      const runByRole = page.getByRole("button", { name: /run|実行/i }).first();
      if ((await runByRole.count()) === 0) {
        throw new Error(
          "Run button was not found. Add a stable data-testid for the run action (e.g., terminal-run)."
        );
      }
      await runByRole.click();
    }

    const res = await waitEvaluate;

    // レスポンスをログ化（UIが未確定でも“結果が返った”ことを証拠にする）
    const url = res.url();
    const status = res.status();

    let bodyPreview = "";
    try {
      const json = await res.json();
      bodyPreview = JSON.stringify(json).slice(0, 800);
    } catch {
      try {
        const text = await res.text();
        bodyPreview = text.slice(0, 800);
      } catch {
        bodyPreview = "(unreadable body)";
      }
    }

    test.info().annotations.push({ type: "evaluate-url", description: url });
    test.info().annotations.push({ type: "evaluate-status", description: String(status) });
    test.info().annotations.push({ type: "evaluate-body-preview", description: bodyPreview });

    // “結果が返った”を最低限担保
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(500);

    // ページが生きてること
    await expect(page.getByTestId("command-builder")).toBeVisible();
  });
});

