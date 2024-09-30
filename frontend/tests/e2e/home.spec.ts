import { test, expect } from "@playwright/test";
import { User } from "./data";
import { loginUser, logoutUser, registerUser } from "./utils";

const user = new User("我好醜");

test.describe("Home", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1/");
  });
  test("Register", async ({ page }) => {
    await registerUser(page, user);
    await page.getByLabel("帳號").click();
    await page.getByLabel("帳號").fill(user.username);
    await page.getByLabel("密碼").fill(user.password);
    await page.getByRole("button", { name: "登入" }).click();
    await expect(await page.getByText("公告欄")).toBeVisible();
  });
  test("login", async ({ page }) => {
    await loginUser(page, user);
  });
  test("apply to competition as player", async ({ page }) => {
    await registerUser(page, user);
    await loginUser(page, user);
    await page.getByLabel("menu").click();
    await page.getByRole("button", { name: "比賽" }).click();
    await page.getByRole("button", { name: "近期比賽" }).click();
    await page.getByRole("button", { name: "申請加入" }).nth(1).click();
    await page.getByRole("button", { name: "申請為選手" }).click();
    await logoutUser(page);
  });
});
