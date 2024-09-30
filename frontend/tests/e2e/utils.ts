import { User } from "./data";
import { Page, expect } from "@playwright/test";
export async function registerUser(page: Page, user: User) {
  await page.goto("http://127.0.0.1/");
  await page.getByLabel("account of current user").click();
  await page.getByRole("menuitem", { name: "登入" }).click();
  await page.getByRole("button", { name: "沒有帳號嗎？" }).click();
  await expect(await page.getByRole("button", { name: "註冊" })).toBeVisible();
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
}

export async function loginUser(page: Page, user: User) {
  await page.goto("http://127.0.0.1/");
  await page.getByLabel("account of current user").click();
  await page.getByRole("menuitem", { name: "登入" }).click();
  await page.getByLabel("帳號").fill(user.username);
  await page.getByLabel("密碼").fill(user.password);
  await page.getByRole("button", { name: "登入" }).click();
  await expect(await page.getByText("公告欄")).toBeVisible();
}

export async function logoutUser(page: Page) {
  await page.goto("http://127.0.0.1/");
  await page.getByLabel("account of current user").click();
  await page.getByRole("menuitem", { name: "登出" }).click();
  await page.getByLabel("account of current user").click();
  await expect(await page.getByText("訪客")).toBeVisible();
}
