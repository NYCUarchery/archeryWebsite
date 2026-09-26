import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function mockUser(page: Page, role: string) {
  await page.route("**/api/user/me", (route) => route.fulfill({ json: { id: 12 } }));
  await page.route("**/api/user/12", (route) =>
    route.fulfill({ json: { id: 12, real_name: "測試管理員", role } }),
  );
}

async function mockDictator(page: Page) {
  await mockUser(page, "Dictator");
  await page.route("**/api/competition", (route) =>
    route.fulfill({ json: [{ id: 7, title: "秋季賽" }] }),
  );
}

const csv = "user_name,real_name,password\n001,王小明,password123";

test("guest bulk registration returns to login and successful login returns to the allowlisted destination", async ({ page }) => {
  let loggedIn = false;
  await page.route("**/api/user/me", (route) =>
    route.fulfill(loggedIn ? { json: { id: 12 } } : { status: 401, json: { error: "unauthorized" } }),
  );
  await page.route("**/api/session", (route) => {
    loggedIn = true;
    return route.fulfill({ json: { message: "登入成功" } });
  });
  await page.route("**/api/user/12", (route) =>
    route.fulfill({ json: { id: 12, real_name: "測試管理員", role: "Dictator" } }),
  );
  await page.route("**/api/competition", (route) => route.fulfill({ json: [] }));

  await page.goto("/bulk_register");
  await expect(page).toHaveURL(/\/login\?next=\/bulk_register$/);
  await expect(page.getByRole("link", { name: "管理員批次註冊" })).toHaveCount(0);
  await page.getByLabel("帳號").fill("dictator");
  await page.getByLabel("密碼").fill("password");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page).toHaveURL(/\/bulk_register$/);
  await expect(page.getByRole("heading", { name: "管理員批次註冊" })).toBeVisible();
});

test("authenticated detail failure remains on bulk registration and can retry", async ({ page }) => {
  let detailCalls = 0;
  await page.route("**/api/user/me", (route) => route.fulfill({ json: { id: 12 } }));
  await page.route("**/api/user/12", (route) => {
    detailCalls += 1;
    return route.fulfill({ status: 500, json: { error: "database unavailable" } });
  });

  await page.goto("/bulk_register");
  await expect(page).toHaveURL(/\/bulk_register$/);
  await expect(page.getByText("無法確認管理員權限。")).toBeVisible();
  await expect(page.getByRole("heading", { name: "管理員批次註冊" })).toHaveCount(0);
  const detailCallsBeforeRetry = detailCalls;
  await page.getByRole("button", { name: "重新嘗試" }).click();
  await expect.poll(() => detailCalls).toBeGreaterThan(detailCallsBeforeRetry);
});

test("non-Dictator cannot access bulk registration", async ({ page }) => {
  await mockUser(page, "Player");
  await page.route("**/api/competition/current/0/2", (route) => route.fulfill({ json: [] }));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "管理員批次註冊" })).toHaveCount(0);
  await page.goto("/bulk_register");
  await expect(page).toHaveURL(/\/$/);
});

test("Dictator previews, invalidates stale preview, and submits once", async ({ page }) => {
  await mockDictator(page);
  await page.route("**/api/competition/current/0/2", (route) => route.fulfill({ json: [] }));
  let previewCalls = 0;
  let submitCalls = 0;
  await page.route("**/api/user/bulk/preview", async (route) => {
    previewCalls += 1;
    expect(route.request().postDataJSON()).toEqual({ competition_id: 7, prefix: "arch-", csv });
    await route.fulfill({
      json: { count: 1, rows: [{ line: 2, user_name: "arch-001", real_name: "王小明" }], errors: [] },
    });
  });
  await page.route("**/api/user/bulk", async (route) => {
    submitCalls += 1;
    await route.fulfill({
      json: { created_count: 1, competition_id: 7, rows: [{ line: 2, user_id: 21, user_name: "arch-001", participant_id: 22, player_id: 23 }] },
    });
  });

  await page.goto("/");
  const bulkLink = page.getByRole("link", { name: "管理員批次註冊" });
  await expect(bulkLink).toBeVisible();
  await bulkLink.click();
  await expect(page).toHaveURL(/\/bulk_register$/);
  await page.getByLabel("賽事").click();
  await page.getByRole("option", { name: "秋季賽" }).click();
  await page.getByLabel("帳號前綴").fill("arch-");
  await page.getByLabel("CSV").fill(csv);
  await page.getByRole("button", { name: "預覽" }).click();
  await expect(page.getByRole("heading", { name: "預覽：1 位" })).toBeVisible();
  await expect(page.getByText("第 2 行：arch-001／王小明")).toBeVisible();

  await page.getByLabel("帳號前綴").fill("new-");
  await expect(page.getByRole("button", { name: "確認建立" })).toBeDisabled();
  await page.getByLabel("帳號前綴").fill("arch-");
  await page.getByRole("button", { name: "預覽" }).click();
  await expect(page.getByRole("button", { name: "確認建立" })).toBeEnabled();
  await page.getByRole("button", { name: "確認建立" }).dblclick();
  await expect(page.getByText("已建立 1 位選手。")).toBeVisible();
  await expect(page.getByLabel("CSV")).toHaveValue("");
  expect(previewCalls).toBe(2);
  expect(submitCalls).toBe(1);
});

test("preview errors block submission and form fits a narrow viewport", async ({ page }) => {
  await mockDictator(page);
  await page.route("**/api/user/bulk/preview", (route) =>
    route.fulfill({
      json: { count: 0, rows: [], errors: [{ line: 2, field: "user_name", message: "帳號已存在" }] },
    }),
  );
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/bulk_register");
  await page.getByLabel("賽事").click();
  await page.getByRole("option", { name: "秋季賽" }).click();
  await page.getByLabel("CSV").fill(csv);
  await page.getByRole("button", { name: "預覽" }).click();
  await expect(page.getByText("第 2 行（user_name）：帳號已存在")).toBeVisible();
  await expect(page.getByRole("button", { name: "確認建立" })).toBeDisabled();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
