import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost/scoring/2");
  await page.getByRole("button", { name: "分" }).click();
  await page.goto("http://localhost/login");
  await page.getByLabel("帳號").click();
  await page.getByLabel("帳號").fill("1c");
  await page.getByLabel("帳號").press("Tab");
  await page.getByLabel("密碼").fill("1c1c1c1c");
  await page.getByLabel("密碼").dblclick();
  await page.getByLabel("帳號").click();
  await page.getByLabel("帳號").fill("1C");
  await page.getByRole("button", { name: "登入" }).click();
  await page.goto("http://localhost/scoring/2");
  await page.getByRole("button", { name: "分" }).click();
  await page.getByRole("menuitem", { name: "紀錄分數" }).click();
  await page.getByRole("button", { name: "- 李峻 9 9 9 7 6" }).click();
  await page
    .locator("div")
    .filter({ hasText: /^確認$/ })
    .getByRole("button")
    .nth(1)
    .click({
      clickCount: 6,
    });
});
