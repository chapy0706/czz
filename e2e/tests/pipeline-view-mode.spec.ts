// apps/user/e2e/pipeline-view-mode.spec.ts
import { expect, test } from "@playwright/test";

/**
 * A-6: Pipeline 二層化（短い/詳細）の E2E
 *
 * 目的：
 * - 表示モード切り替えが効くこと（compact <-> detailed）
 * - 画面が壊れないこと（最低限の UI 存在チェック）
 *
 * 注意：
 * - コマンドを積む導線はプロジェクトの UI に依存するので、
 *   まずは「PipelinePanel が出る画面」に到達できる URL に合わせて調整する。
 */

test.describe("Pipeline view mode", () => {
  test("toggles compact/detailed views", async ({ page }) => {
    const candidates = [
      "/",            // home
      "/tasks",       // tasks list (よくある)
      "/tasks/new",   // task create
      "/play",        // play page (よくある)
      "/app",         // app root (よくある)
    ];

    const pipePanel = page.getByTestId("pipe-panel");

    async function gotoWherePipePanelIsVisible(): Promise<string> {
      for (const path of candidates) {
        try {
          await page.goto(path);
          await pipePanel.waitFor({ state: "visible", timeout: 2000 });
          return path;
        } catch {
          // try next
        }
      }

      // 追加フォールバック: “Tasks/タスク” 的なリンクがあれば踏む
      try {
        await page.goto("/");
        const taskLink = page.getByRole("link", { name: /tasks|task|タスク/i }).first();
        if (await taskLink.count()) {
          await taskLink.click();
          await pipePanel.waitFor({ state: "visible", timeout: 2000 });
          return "clicked-tasks-link";
        }
      } catch {
        // ignore
      }

      throw new Error(
        `pipe-panel was not visible. Tried paths: ${candidates.join(", ")}. ` +
          `Hint: add the real page path that renders PipelinePanel to candidates.`
      );
    }

    await gotoWherePipePanelIsVisible();

    // PipelinePanel が表示される状態にする必要がある。
    // 既に初期表示で出るならこのままでOK。
    // 出ない場合は、ここに「タスク選択」「コマンド追加」などの操作を足す。

    await expect(page.getByTestId("pipe-panel")).toBeVisible();

    // Toggle が存在する（A-6 の追加要素）
    await expect(page.getByTestId("pipe-view-toggle")).toBeVisible();

    // 詳細表示へ
    await page.getByTestId("pipe-view-detailed").click();

    // 詳細側は「pipe-strip」が見える想定（selectedIndex >= 0 の時だけ）
    // ただし未選択だと出ないので、まずは「未選択でもトグルが壊れない」ことを確認する。
    // 選択済み状態にできる導線があるなら、以下の expect を有効化して使う。
    // await expect(page.getByTestId("pipe-strip")).toBeVisible();

    // 短い表示へ
    await page.getByTestId("pipe-view-compact").click();
    // compact 側は selectedIndex >= 0 の時だけ見える（同上）
    // 選択済み状態にできる導線があるなら、以下の expect を有効化して使う。
    // await expect(page.getByTestId("pipe-compact-view")).toBeVisible();

    // 少なくともパネルが落ちていない（切り替え操作でクラッシュしてない）ことを保証
    await expect(page.getByTestId("pipe-panel")).toBeVisible();
  });
});

