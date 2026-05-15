import { expect, test } from "@playwright/test";

test.describe("認証ガード", () => {
  test("未ログインで /admin にアクセスすると /auth/login にリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(
      page.getByRole("heading", { name: "管理画面ログイン" }),
    ).toBeVisible();
  });

  test("ログインフォームのバリデーションが効く", async ({ page }) => {
    await page.goto("/auth/login");

    const email = page.getByLabel("メールアドレス");
    const password = page.getByLabel("パスワード");

    await expect(email).toHaveAttribute("required", "");
    await expect(password).toHaveAttribute("required", "");
    await expect(email).toHaveAttribute("type", "email");
    await expect(password).toHaveAttribute("type", "password");
  });
});
