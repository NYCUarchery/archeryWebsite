import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost/scoring/2");
  await page.getByRole("button", { name: "分" }).click();
  await page.goto("http://localhost/Login");
  await page.getByLabel("帳號").click();
  await page.getByLabel("帳號").fill("Oatmeal");
  await page.getByLabel("帳號").press("Tab");
  await page.getByLabel("密碼").fill("Waaaaaaaa");
  await page.getByRole("button", { name: "登入" }).click();
  await page.goto("http://localhost/scoring/2");
  await page.getByRole("button", { name: "分" }).click();
  await page.getByRole("menuitem", { name: "監控" }).click();
  await page.getByRole("tab", { name: "進度" }).click();
  await page.getByText("1C").click();
  await page.getByText("1B").click();
  await page.getByText("1A").click();
  await page.getByText("1D").click();
});
