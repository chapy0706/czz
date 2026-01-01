// e2e/tests/command-builder-unix-hints.spec.ts
import { expect, test } from "@playwright/test";
import {
  addCommandByType,
  clickByTestIdRobust,
  ensureAtLeastOneCommand,
  selectFirstCommandRow,
} from "./_helpers/ui";

const TASK_ID = process.env.E2E_TASK_ID ?? "00000000-0000-0000-0000-000000000202";

test("command builder: shows unix hint in detailed runner view for MAP_ADD", async ({ page }) => {
  await page.goto(`/tasks/${TASK_ID}`);
  await expect(page.getByTestId("command-builder")).toBeVisible({ timeout: 10_000 });

  await ensureAtLeastOneCommand(page);

  if (await page.getByTestId("cb-add-open").count()) {
    await addCommandByType(page, "MAP_ADD");
  }

  await selectFirstCommandRow(page);

  // pipe-panel は strict 回避で .first()
  await expect(page.locator('[data-testid="pipe-panel"]').first()).toBeVisible({ timeout: 10_000 });

  // overlay が残っても押せるように robust click
  await clickByTestIdRobust(page, "pipe-view-detailed");

  await expect(page.getByTestId("pipe-strip")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("pipe-preview").first()).toBeVisible({ timeout: 10_000 });
});
