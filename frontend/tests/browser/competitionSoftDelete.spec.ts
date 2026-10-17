import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

const competitionId = 710;
const userId = 12;
const competitionTitle = "測試中的比賽";

type SoftDeleteRoutes = {
  deleteRequests: () => number;
  userCompetitionRequests: () => number;
};

async function registerSoftDeleteRoutes(
  page: Page,
  deleteStatuses: number[] = [200],
  userCompetitionPages: unknown[][] = [[]],
): Promise<SoftDeleteRoutes> {
  let deleteCount = 0;
  let userCompetitionRequestCount = 0;

  // Competition layout: current user, competition, membership, and player lookup.
  await page.route("**/api/user/me", (route) =>
    route.fulfill({ json: { id: userId } }),
  );
  await page.route(`**/api/user/${userId}`, (route) =>
    route.fulfill({ json: { id: userId, real_name: "管理員", role: "User" } }),
  );
  await page.route(`**/api/competition/groups/${competitionId}`, (route) =>
    route.fulfill({
      json: { id: competitionId, title: competitionTitle, sub_title: "軟刪除回歸", groups: [] },
    }),
  );
  await page.route(`**/api/participant/competition/user/${competitionId}/${userId}`, (route) =>
    route.fulfill({
      json: [{ id: 71, competition_id: competitionId, user_id: userId, role: "Admin", status: "approved" }],
    }),
  );
  await page.route(`**/api/competition/groups/players/${competitionId}`, (route) =>
    route.fulfill({ json: { id: competitionId, groups: [] } }),
  );

  // Destination after success: My Competitions reads the current user's first page.
  await page.route(`**/api/competition/user/${userId}/0/4`, (route) => {
    const competitions = userCompetitionPages[
      Math.min(userCompetitionRequestCount++, userCompetitionPages.length - 1)
    ];
    return route.fulfill({
      json: competitions,
      headers: { "X-Total-Count": String(competitions.length) },
    });
  });
  await page.route(`**/api/competition/${competitionId}`, (route) => {
    expect(route.request().method()).toBe("DELETE");
    deleteCount++;
    const status = deleteStatuses.shift() ?? 200;
    return route.fulfill({
      status,
      json: status === 200 ? { message: "deleted" } : { error: "delete failed" },
    });
  });

  return {
    deleteRequests: () => deleteCount,
    userCompetitionRequests: () => userCompetitionRequestCount,
  };
}

async function gotoAdminMain(page: Page) {
  await page.goto(`/competition/${competitionId}/admin/main`);
  await expect(page.getByRole("button", { name: "刪除比賽" })).toBeVisible();
}

function deleteDialog(page: Page) {
  return page.getByRole("dialog", { name: `刪除「${competitionTitle}」？` });
}

test.describe("Competition 軟刪除管理介面", () => {
  test("顯示保留資料與僅限資料庫復原警告；取消不送 DELETE", async ({ page }) => {
    const routes = await registerSoftDeleteRoutes(page);
    await gotoAdminMain(page);

    await page.getByRole("button", { name: "刪除比賽" }).click();
    const dialog = deleteDialog(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("會保留所有組別、參加者與成績資料");
    await expect(dialog).toContainText("資料庫將 deleted_at 設回 NULL");

    await dialog.getByRole("button", { name: "取消" }).click();
    await expect(dialog).toBeHidden();
    expect(routes.deleteRequests()).toBe(0);
  });

  test("確認後 DELETE 目標賽事並改往我的比賽", async ({ page }) => {
    const routes = await registerSoftDeleteRoutes(page);
    await gotoAdminMain(page);

    await page.getByRole("button", { name: "刪除比賽" }).click();
    await deleteDialog(page).getByRole("button", { name: "確認軟刪除" }).click();

    await page.waitForURL(/\/my_competitions$/);
    await expect(page.getByRole("heading", { name: "我的比賽" })).toBeVisible();
    expect(routes.deleteRequests()).toBe(1);
  });

  test("暖快取的我的比賽會在刪除後重新取得", async ({ page }) => {
    const routes = await registerSoftDeleteRoutes(page, [200], [
      [{ id: competitionId, title: competitionTitle }],
      [],
    ]);
    await page.goto("/my_competitions");
    await expect(page.getByRole("heading", { name: competitionTitle })).toBeVisible();

    await gotoAdminMain(page);
    await page.getByRole("button", { name: "刪除比賽" }).click();
    await deleteDialog(page).getByRole("button", { name: "確認軟刪除" }).click();

    await page.waitForURL(/\/my_competitions$/);
    await expect(page.getByRole("heading", { name: "您尚未參與任何比賽" })).toBeVisible();
    expect(routes.userCompetitionRequests()).toBe(2);
  });

  test("403 或 500 時保留對話框並顯示失敗", async ({ page }) => {
    const routes = await registerSoftDeleteRoutes(page, [403, 500]);
    await gotoAdminMain(page);

    await page.getByRole("button", { name: "刪除比賽" }).click();
    const dialog = deleteDialog(page);
    const confirm = dialog.getByRole("button", { name: "確認軟刪除" });
    for (const expectedDeleteCount of [1, 2]) {
      await confirm.click();
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole("alert")).toContainText("刪除失敗");
      expect(routes.deleteRequests()).toBe(expectedDeleteCount);
    }
    await expect(page).toHaveURL(new RegExp(`/competition/${competitionId}/admin/main$`));
  });
});
