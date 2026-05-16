import { expect, test } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

test.describe("管理画面フロー", () => {
  test.skip(
    !TEST_EMAIL || !TEST_PASSWORD,
    "E2E_TEST_EMAIL / E2E_TEST_PASSWORD が未設定のためスキップ",
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("メールアドレス").fill(TEST_EMAIL!);
    await page.getByLabel("パスワード").fill(TEST_PASSWORD!);
    await page.getByRole("button", { name: /ログイン/ }).click();
    await page.waitForURL(/\/admin/);
  });

  test("ログイン後、動画新規作成ページが開ける", async ({ page }) => {
    await page.goto("/admin/videos/new");
    await expect(
      page.getByRole("heading", { name: "動画を新規作成" }),
    ).toBeVisible();
  });

  test.fixme(
    "cast-selector で芸人を選択して動画を保存できる",
    async () => {
      // TODO: cast-selector の操作と保存後のリダイレクトを検証する。
    },
  );

  test.fixme("メモを追加・編集できる", async () => {
    // TODO: 認証ユーザーのみメモ追加 UI が表示されることと、追加・編集の動作を検証する。
  });
});
