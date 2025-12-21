// e2e/tests/pseudo-terminal.spec.ts
import { expect, test } from "@playwright/test";

test("pseudo terminal: invalid json shows stderr and exit 1, :clear clears logs", async ({ page }) => {
  await page.goto("/tasks/00000000-0000-0000-0000-000000000000");

  const input = page.getByTestId("terminal-input");
  await expect(input).toBeVisible();

  await input.fill("not json");
  await input.press("Enter");

  await expect(page.getByText(/ERR: input must be JSON/i)).toBeVisible();
  await expect(page.getByText("exit 1")).toBeVisible();

  await input.fill(":clear");
  await input.press("Enter");

  await expect(page.getByText("exit 1")).toHaveCount(0);
  await expect(page.getByText(/ERR: input must be JSON/i)).toHaveCount(0);
});
