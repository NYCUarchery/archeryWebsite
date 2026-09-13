import { User } from "./data";
import { expect } from "./fixtures";
import type { Page } from "@playwright/test";
export async function registerUser(page: Page, user: User) {
  await page.goto("/");
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

export type Credentials = Pick<User, "username" | "password">;

export async function loginUser(page: Page, user: Credentials) {
  await page.goto("/");
  await page.getByLabel("account of current user").click();
  await page.getByRole("menuitem", { name: "登入" }).click();
  await page.getByLabel("帳號").fill(user.username);
  await page.getByLabel("密碼").fill(user.password);
  const sessionCreated = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "POST" && /^\/api\/session\/?$/.test(path) && candidate.status() === 200;
  });
  const currentUserRead = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "GET" && path === "/api/user/me" && candidate.status() === 200;
  });
  await page.getByRole("button", { name: "登入" }).click();
  await Promise.all([sessionCreated, currentUserRead]);
  await expect(page.getByText("公告欄")).toBeVisible();
}

export async function logoutUser(page: Page) {
  await page.goto("/");
  await page.getByLabel("account of current user").click();
  await page.getByRole("menuitem", { name: "登出" }).click();
  await page.getByLabel("account of current user").click();
  await expect(page.getByText("訪客", { exact: true })).toBeVisible();
}
