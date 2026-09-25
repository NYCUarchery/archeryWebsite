import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

const competition = (id: number) => ({
  id,
  title: `真實比賽 ${id}`,
  sub_title: `第 ${id} 場`,
});

async function mockGuest(page: Page) {
  await page.route("**/api/user/me", (route) =>
    route.fulfill({ status: 401, json: { error: "unauthorized" } }),
  );
}

async function mockUser(page: Page, role: string) {
  await page.route("**/api/user/me", (route) =>
    route.fulfill({ json: { id: 12 } }),
  );
  await page.route("**/api/user/12", (route) =>
    route.fulfill({ json: { id: 12, real_name: "測試使用者", role } }),
  );
}

async function mockPagedCompetitions(page: Page, kind: "current" | "user", firstPage: number[]) {
  const prefix = kind === "current" ? "/api/competition/current" : "/api/competition/user/12";
  const requests: string[] = [];
  await page.route(`**${prefix}/**`, (route) => {
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    const ids = path.endsWith("/0/4") ? firstPage : path.endsWith("/5/9") ? [6] : [];
    return route.fulfill({
      json: ids.map(competition),
      headers: { "X-Total-Count": "6" },
    });
  });
  return requests;
}

test("guest home shows real empty state and footer fits a narrow viewport", async ({ page }) => {
  await mockGuest(page);
  await page.route("**/api/competition/current/0/2", (route) =>
    route.fulfill({ json: [], headers: { "X-Total-Count": "0" } }),
  );
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "目前沒有近期比賽" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "公告" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "主要導覽" });
  for (const label of ["首頁", "比賽列表", "我的比賽"]) {
    await expect(nav.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: /登入/ })).toBeVisible();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    const geometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      footerBottom: document.querySelector("footer")!.getBoundingClientRect().bottom,
      viewportHeight: window.innerHeight,
    }));
    expect(geometry.overflow).toBeLessThanOrEqual(1);
    expect(Math.abs(geometry.footerBottom - geometry.viewportHeight)).toBeLessThanOrEqual(1);
  }
});

test("recent list page numbers fetch and show the matching five-item slice", async ({ page }) => {
  await mockGuest(page);
  const requests = await mockPagedCompetitions(page, "current", [1, 2, 3, 4, 5]);
  await page.goto("/recent_competitions");
  await expect(page.locator(".home-competition-list article")).toHaveCount(5);
  await expect(page.getByRole("heading", { name: "真實比賽 1" })).toBeVisible();
  await page.locator(".home-pagination button").filter({ hasText: "2" }).click();
  await expect(page.getByRole("heading", { name: "真實比賽 6" })).toBeVisible();
  await expect(page.locator(".home-competition-list article")).toHaveCount(1);
  expect(requests).toContain("/api/competition/current/0/4");
  expect(requests).toContain("/api/competition/current/5/9");
});

test("My Competitions shows empty state and Dictator-only create entry", async ({ page }) => {
  await mockUser(page, "Dictator");
  await page.route("**/api/competition/user/12/0/4", (route) =>
    route.fulfill({ json: [], headers: { "X-Total-Count": "0" } }),
  );
  await page.goto("/my_competitions");
  await expect(page.getByRole("heading", { name: "您尚未參與任何比賽" })).toBeVisible();
  await expect(page.getByRole("button", { name: "創建新的比賽" })).toBeVisible();
});

test("My Competitions pagination uses the user count", async ({ page }) => {
  await mockUser(page, "Player");
  const requests = await mockPagedCompetitions(page, "user", [1, 2, 3, 4, 5]);
  await page.goto("/my_competitions");
  await expect(page.locator(".home-competition-list article")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "創建新的比賽" })).toHaveCount(0);
  await page.locator(".home-pagination button").filter({ hasText: "2" }).click();
  await expect(page.getByRole("heading", { name: "真實比賽 6" })).toBeVisible();
  expect(requests).toContain("/api/competition/user/12/0/4");
  expect(requests).toContain("/api/competition/user/12/5/9");
});
