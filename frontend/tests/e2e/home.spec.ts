import { test, expect } from "@playwright/test";
import { User } from "./data";

const user = new User("我好醜");

test.describe("Home", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1/");
  });
  test("Register", async ({ page }) => {
    await page.goto("http://127.0.0.1/");
    await page.getByLabel("account of current user").click();
    await page.getByRole("menuitem", { name: "登入" }).click();
    await page.getByRole("button", { name: "沒有帳號嗎？" }).click();
    await expect(
      await page.getByRole("button", { name: "註冊" })
    ).toBeVisible();
    await page.getByLabel("帳號").click();
    await page.getByLabel("帳號").fill(user.username);
    await page.getByLabel("密碼", { exact: true }).click();
    await page.getByLabel("密碼", { exact: true }).fill(user.password);
    await page.getByLabel("確認密碼").click();
    await page.getByLabel("確認密碼").fill(user.password);
    await page.getByLabel("真實姓名").click();
    await page.getByLabel("真實姓名").fill(user.name);
    await page.getByLabel("電子郵件").click();
    await page.getByLabel("電子郵件").fill(user.email);
    await page.getByLabel("組織/學校").click();
    await page.getByRole("option", { name: "NYCU" }).click();
    await page.getByRole("button", { name: "註冊" }).click();
    await expect(page.getByRole("button", { name: "註冊" })).not.toBeVisible();
    await page.getByLabel("帳號").click();
    await page.getByLabel("帳號").fill(user.username);
    await page.getByLabel("密碼").fill(user.password);
    await page.getByRole("button", { name: "登入" }).click();
    await expect(await page.getByText("公告欄")).toBeVisible();
  });
  test("login", async ({ page }) => {
    await page.getByLabel("account of current user").click();
    await page.getByRole("menuitem", { name: "登入" }).click();
    await page.getByLabel("帳號").fill("Oatmeal");
    await page.getByLabel("密碼").fill("Waaaaaaaa");
    await page.getByRole("button", { name: "登入" }).click();
    await expect(await page.getByText("公告欄")).toBeVisible();
  });
});
