import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const competitionId = 4702;
const userId = 91;
const activationPath = `/competition/${competitionId}/admin/schedule/activation`;

async function mockCompetition(page: Page, active = true) {
  let competitionRequests = 0;
  await page.route("**/api/user/me", (route) => route.fulfill({ json: { id: userId } }));
  await page.route(`**/api/user/${userId}`, (route) => route.fulfill({
    json: { id: userId, real_name: "管理員", role: "User" },
  }));
  await page.route(`**/api/competition/groups/${competitionId}`, (route) => {
    competitionRequests++;
    return route.fulfill({ json: {
      id: competitionId,
      title: "賽制補建測試",
      groups: [],
      qualification_is_active: true,
      elimination_is_active: active,
      team_elimination_is_active: active,
      mixed_elimination_is_active: active,
      current_phase: 0,
    } });
  });
  await page.route(`**/api/participant/competition/user/${competitionId}/${userId}`, (route) => route.fulfill({
    json: [{ id: 71, competition_id: competitionId, user_id: userId, role: "Admin", status: "approved" }],
  }));
  await page.route(`**/api/competition/groups/players/${competitionId}`, (route) =>
    route.fulfill({ json: { id: competitionId, groups: [] } }),
  );
  return { competitionRequests: () => competitionRequests };
}

test("已啟用賽制可補建，等待時停用按鈕，200 與 204 顯示不同結果", async ({ page }) => {
  const requests = await mockCompetition(page);
  let individualRequests = 0;
  let teamRequests = 0;
  let mixedRequests = 0;
  let releaseTeam!: () => void;
  const teamResponse = new Promise<void>((resolve) => { releaseTeam = resolve; });
  await page.route(`**/api/competition/elimination-isactive/${competitionId}`, (route) => {
    expect(route.request().method()).toBe("PATCH");
    individualRequests++;
    return individualRequests === 1
      ? route.fulfill({ status: 200, json: {} })
      : route.fulfill({ status: 204 });
  });
  await page.route(`**/api/competition/team-elimination-isactive/${competitionId}`, async (route) => {
    expect(route.request().method()).toBe("PATCH");
    teamRequests++;
    await teamResponse;
    await route.fulfill({ status: 200, json: {} });
  });
  await page.route(`**/api/competition/mixed-elimination-isactive/${competitionId}`, (route) => {
    expect(route.request().method()).toBe("PATCH");
    mixedRequests++;
    return route.fulfill({ status: 204 });
  });
  await page.goto(activationPath);
  const activationButtons = page.getByRole("group", { name: "開啟賽程", exact: true });
  await expect(activationButtons.getByRole("button", { name: "對抗賽", exact: true })).toBeDisabled();
  await expect(activationButtons.getByRole("button", { name: "團體對抗賽", exact: true })).toBeDisabled();
  await expect(activationButtons.getByRole("button", { name: "混雙對抗賽", exact: true })).toBeDisabled();
  const teamRepair = page.getByRole("button", { name: "補建團體對抗賽缺漏", exact: true });
  const mixedRepair = page.getByRole("button", { name: "補建混雙對抗賽缺漏", exact: true });
  const individualRepair = page.getByRole("button", { name: "補建個人對抗賽缺漏", exact: true });
  await expect(individualRepair).toBeVisible();
  await expect(teamRepair).toBeVisible();
  await expect(mixedRepair).toBeVisible();
  await individualRepair.click();
  await expect(page.getByRole("alert").filter({ hasText: "個人對抗賽缺漏已補齊。" })).toBeVisible();
  await expect(individualRepair).toBeEnabled();
  await individualRepair.click();
  await expect(page.getByRole("alert").filter({ hasText: "個人對抗賽資料已完整，無須補建。" })).toBeVisible();
  const initialReads = requests.competitionRequests();
  await teamRepair.click();
  try {
    await expect(teamRepair).toBeDisabled();
    await expect.poll(() => teamRequests).toBe(1);
  } finally {
    releaseTeam();
  }
  await expect(page.getByRole("alert").filter({ hasText: "團體對抗賽缺漏已補齊。" })).toBeVisible();
  await expect(teamRepair).toBeEnabled();
  await expect.poll(requests.competitionRequests).toBeGreaterThan(initialReads);
  const readsAfterTeam = requests.competitionRequests();
  await mixedRepair.click();
  await expect(page.getByRole("alert").filter({ hasText: "混雙對抗賽資料已完整，無須補建。" })).toBeVisible();
  await expect.poll(requests.competitionRequests).toBeGreaterThan(readsAfterTeam);
  expect(teamRequests).toBe(1);
  expect(mixedRequests).toBe(1);
  expect(individualRequests).toBe(2);
});

test("補建衝突與伺服器失敗顯示提示，恢復按鈕供重試", async ({ page }) => {
  await mockCompetition(page);
  let attempts = 0;
  await page.route(`**/api/competition/team-elimination-isactive/${competitionId}`, (route) => {
    expect(route.request().method()).toBe("PATCH");
    return route.fulfill({
      status: attempts++ === 0 ? 409 : 500,
      json: { error: "repair failed" },
    });
  });
  await page.goto(activationPath);
  const repair = page.getByRole("button", { name: "補建團體對抗賽缺漏", exact: true });
  await repair.click();
  await expect(page.getByRole("alert").filter({ hasText: "重複" })).toBeVisible();
  await expect(repair).toBeEnabled();
  await repair.click();
  await expect(page.getByRole("alert").filter({ hasText: "補建團體對抗賽缺漏失敗" })).toBeVisible();
  await expect(repair).toBeEnabled();
  expect(attempts).toBe(2);
});

test("未啟用個人、團體與混雙時僅提供原啟用按鈕", async ({ page }) => {
  await mockCompetition(page, false);
  await page.goto(activationPath);
  const activationButtons = page.getByRole("group", { name: "開啟賽程", exact: true });
  await expect(activationButtons.getByRole("button", { name: "對抗賽", exact: true })).toBeEnabled();
  await expect(activationButtons.getByRole("button", { name: "團體對抗賽", exact: true })).toBeEnabled();
  await expect(activationButtons.getByRole("button", { name: "混雙對抗賽", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "補建團體對抗賽缺漏", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "補建混雙對抗賽缺漏", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "補建個人對抗賽缺漏", exact: true })).toHaveCount(0);
});
