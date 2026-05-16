import { expect, test } from "@playwright/test";

test.describe("公開側", () => {
  test("トップページが表示される", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/DonDecorte/i);
  });

  test("動画一覧ページに見出しが表示される", async ({ page }) => {
    await page.goto("/videos");
    await expect(
      page.getByRole("heading", { level: 1, name: "動画" }),
    ).toBeVisible();
  });
});
