import { test, expect } from "@playwright/test";

test.describe("Recording Board", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost/Login");
    await page.getByLabel("帳號").fill("1C");
    await page.getByLabel("密碼").fill("1c1c1c1c");
    await page.getByRole("button", { name: "登入" }).click();
    await expect(await page.getByText("公告欄")).toBeVisible();
    await page.goto("http://localhost/scoring/2");
    await page.getByRole("button", { name: "分" }).click();
    await page.getByRole("menuitem", { name: "紀錄分數" }).click();
  });

  test("Pre competiion prompt", async ({ page }) => {
    await page.goto("http://localhost/scoring/1");
    await page.getByRole("button", { name: "分" }).click();
    await page.getByRole("menuitem", { name: "紀錄分數" }).click();
    await expect(
      await page.getByRole("heading", {
        name: "還沒開始，我知道你很急但你先別急。",
      })
    ).toBeVisible();
  });
  test("Lane player names", async ({ page }) => {
    await expect(await page.getByText("吳柏橙")).toBeVisible();
    await expect(await page.getByText("蕭邦聿")).toBeVisible();
    await expect(
      await page
        .getByRole("button", { name: "✔ 李峻 9 9 9 7 6" })
        .getByText("李峻")
    ).toBeVisible();
    await expect(await page.getByText("盧均祐")).toBeVisible();
  });

  test("Score editing", async ({ page }) => {
    await unconfirm(page);

    await page.getByRole("button", { name: "- 李峻 9 9 9 7 6" }).click();
    for (let i = 0; i < 6; i++) {
      await page
        .locator("div")
        .filter({ hasText: /^確認$/ })
        .getByRole("button")
        .nth(1)
        .click();
    }
    await expect(page.getByRole("button", { name: "- 李峻" })).toBeVisible();
    await page.getByRole("button", { name: "9", exact: true }).click();
    await page.getByRole("button", { name: "9", exact: true }).click();
    await page.getByRole("button", { name: "9", exact: true }).click();
    await page.getByRole("button", { name: "7", exact: true }).click();
    await page.getByRole("button", { name: "6", exact: true }).click();
    await page.getByRole("button", { name: "4", exact: true }).click();

    await unconfirm(page);
    await expect(
      page.getByRole("button", { name: "✔ 李峻 9 9 9 7 6" })
    ).toBeVisible();
  });
});

async function unconfirm(page) {
  await page.goto("http://localhost/");
  await page.getByLabel("account of current user").click();
  await page.getByRole("menuitem", { name: "登出" }).click();
  await page.getByLabel("account of current user").click();
  await page.getByRole("menuitem", { name: "登入" }).click();
  await page.getByLabel("帳號").fill("Oatmeal");
  await page.getByLabel("密碼").fill("Waaaaaaaa");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(await page.getByText("公告欄")).toBeVisible();
  await page.goto("http://localhost/scoring/2");
  await page.getByRole("button", { name: "分" }).click();
  await page.getByRole("menuitem", { name: "監控" }).click();
  await page.getByRole("tab", { name: "進度" }).click();
  await page.getByText("1C").click();
  await page.getByText("1B").click();
  await page.getByText("1A").click();
  await page.getByText("1D").click();
  await page.goto("http://localhost/");
  await page.getByLabel("account of current user").click();
  await page.getByRole("menuitem", { name: "登出" }).click();
  await page.goto("http://localhost/Login");
  await page.getByLabel("帳號").fill("1C");
  await page.getByLabel("密碼").fill("1c1c1c1c");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(await page.getByText("公告欄")).toBeVisible();
  await page.goto("http://localhost/scoring/2");
  await page.getByRole("button", { name: "分" }).click();
  await page.getByRole("menuitem", { name: "紀錄分數" }).click();
}
