import { expect, test } from "./fixtures";

const competitionId = 4701;
const csv = "player_name,group_name,position\n王小明,公開男子反曲弓組,1A";

async function mockCompetitionShell(page: import("@playwright/test").Page) {
  await page.route("**/api/user/me", (route) => route.fulfill({ json: { id: 91 } }));
  await page.route("**/api/user/91", (route) => route.fulfill({ json: { id: 91, real_name: "管理員", role: "Admin" } }));
  await page.route(`**/api/competition/groups/${competitionId}`, (route) => route.fulfill({
    json: { id: competitionId, title: "測試賽事", groups: [] },
  }));
  await page.route(`**/api/participant/competition/user/${competitionId}/91`, (route) => route.fulfill({ json: [] }));
  await page.route(`**/api/competition/groups/players/${competitionId}`, (route) => route.fulfill({ json: { groups: [] } }));
}

test("資格賽 CSV 貼上可預覽、編輯後失效、顯示錯誤並只送出一次", async ({ page }) => {
  await mockCompetitionShell(page);
  let previewCalls = 0;
  let importCalls = 0;
  await page.route(`**/api/competition/${competitionId}/qualification-assignments/preview`, async (route) => {
    previewCalls += 1;
    const request = route.request().postDataJSON() as { csv: string };
    if (request.csv.includes("錯誤選手")) {
      await route.fulfill({ json: { count: 0, rows: [], errors: [{ line: 2, field: "position", message: "靶道不屬於組別" }] } });
      return;
    }
    await route.fulfill({ json: {
      count: 1,
      rows: [{ line: 2, player_name: "王小明", group_name: "公開男子反曲弓組", position: "1A", player_id: 1, group_id: 2, lane_number: 1, target: "A" }],
      errors: [],
    } });
  });
  await page.route(`**/api/competition/${competitionId}/qualification-assignments`, async (route) => {
    importCalls += 1;
    expect(route.request().postDataJSON()).toEqual({ csv });
    if (importCalls === 1) {
      await route.fulfill({ status: 422, json: { errors: [{ line: 2, field: "position", message: "靶位已被使用" }] } });
      return;
    }
    await route.fulfill({ json: { assigned_count: 1 } });
  });

  await page.goto(`/competition/${competitionId}/admin/groups`);
  await page.getByRole("button", { name: "貼上 CSV 指派" }).click();
  const input = page.getByRole("textbox", { name: "貼上 CSV 內容" });
  await input.fill(csv);
  await page.getByRole("button", { name: "預覽" }).click();
  await expect(page.getByRole("heading", { name: "預覽：1 位" })).toBeVisible();
  await expect(page.getByText("第 2 行：王小明／公開男子反曲弓組／1A")).toBeVisible();

  await input.fill("player_name,group_name,position\n錯誤選手,公開男子反曲弓組,9A");
  await expect(page.getByRole("heading", { name: "預覽：1 位" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "確認匯入" })).toBeDisabled();
  await page.getByRole("button", { name: "預覽" }).click();
  await expect(page.getByText("第 2 行（position）：靶道不屬於組別")).toBeVisible();
  await expect(page.getByRole("button", { name: "確認匯入" })).toBeDisabled();

  await input.fill(csv);
  await expect(page.getByRole("button", { name: "預覽" })).toBeEnabled();
  await page.getByRole("button", { name: "預覽" }).click();
  await expect(page.getByRole("button", { name: "確認匯入" })).toBeEnabled();
  await page.getByRole("button", { name: "確認匯入" }).click();
  await expect(page.getByText("第 2 行（position）：靶位已被使用")).toBeVisible();
  await expect(page.getByRole("button", { name: "確認匯入" })).toBeDisabled();
  await page.getByRole("button", { name: "預覽" }).click();
  await page.getByRole("button", { name: "確認匯入" }).dblclick();
  await expect(page.getByText("已指派 1 位選手。")).toBeVisible();
  await expect(input).toBeEmpty();
  expect(previewCalls).toBe(4);
  expect(importCalls).toBe(2);
});
