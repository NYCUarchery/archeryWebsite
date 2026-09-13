import { expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { loginUser } from "../utils";

export const password = "archery-e2e-password";
export const admin = "e2e.admin";
export const judge = "e2e.judge";
export const archers = Array.from({ length: 24 }, (_, index) =>
  `e2e.archer.${String(index + 1).padStart(2, "0")}`,
);

export async function signIn(page: Page, username: string) {
  await loginUser(page, { username, password });
}

export async function signedInPage(browser: Browser, baseURL: string, username: string, options?: { viewport?: { width: number; height: number } }): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ baseURL, ...options });
  const page = await context.newPage();
  await signIn(page, username);
  return { context, page };
}

export async function applyToCompetition(page: Page, title: string, role: "選手" | "裁判") {
  await page.goto("/recent_competitions");
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  // The list's outer pagination Card and inner competition Card both contain
  // its title; the actionable control is the stable, unique boundary.
  const apply = page.getByRole("button", { name: "申請加入" });
  await expect(apply).toHaveCount(1);
  await apply.click();
  await page.getByRole("button", { name: `申請為${role}` }).click();
  await expect(page.getByText("申請成功!")).toBeVisible();
}

export async function createCompetition(page: Page, title: string): Promise<number> {
  await page.goto("/create_competition");
  await expect(page.getByLabel("主辦者UID")).not.toHaveValue("");
  await page.getByLabel("比賽名稱").fill(title);
  await page.getByLabel("比賽副標題").fill("兩組別個人賽 E2E");
  await page.getByLabel("局數").fill("1");
  await page.getByLabel("靶道數量").fill("12");
  await page.getByLabel("簡介").fill("由真實 UI 建立及操作的測試賽事");
  const response = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "POST" &&
      /^\/api\/competition\/?$/.test(path) &&
      [200, 201].includes(candidate.status());
  });
  await page.getByRole("button", { name: "創建比賽" }).click();
  const body = await (await response).json() as { id?: number };
  expect(body.id, "建立比賽 response 必須回傳 id").toBeTruthy();
  await expect(page.getByText("創建比賽成功")).toBeVisible();
  return body.id as number;
}

export async function approveAllApplicants(page: Page, competitionId: number, expectedCount: number) {
  await page.goto(`/competition/${competitionId}/admin/participants`);
  const grid = page.getByRole("grid");
  await expect(grid).toBeVisible();
  const response = await page.request.get(`/api/participant/competition/${competitionId}`);
  expect(response.ok()).toBeTruthy();
  const pending = (await response.json() as Array<{ id: number; status: string }>).filter((participant) => participant.status === "pending");
  expect(pending).toHaveLength(expectedCount);
  const scroller = grid.locator(".MuiDataGrid-virtualScroller");
  const findRow = async (id: number) => {
    for (let offset = 0; offset <= 2_000; offset += 240) {
      const row = grid.locator(`[data-id="${id}"]`);
      if (await row.count()) return row;
      await scroller.evaluate((element, top) => { element.scrollTop = top; }, offset);
    }
    throw new Error(`participant ${id} did not render in DataGrid`);
  };
  for (const participant of pending) {
    const row = await findRow(participant.id);
    await row.getByRole("checkbox").check();
    await page.getByRole("button", { name: "核准" }).click();
    await expect.poll(async () => {
      const refreshed = await page.request.get(`/api/participant/competition/${competitionId}`);
      const participants = await refreshed.json() as Array<{ id: number; status: string }>;
      return participants.find((candidate) => candidate.id === participant.id)?.status;
    }).toBe("approved");
  }
  await expect.poll(async () => {
    const refreshed = await page.request.get(`/api/participant/competition/${competitionId}`);
    const participants = await refreshed.json() as Array<{ status: string }>;
    return participants.filter((participant) => participant.status === "pending").length;
  }).toBe(0);
}

export async function createGroup(page: Page, competitionId: number, name: string, bow: "反曲弓" | "複合弓") {
  await page.goto(`/competition/${competitionId}/admin/groups`);
  await page.getByRole("button", { name: "創建組別" }).click();
  const dialog = page.getByRole("dialog", { name: "創建組別" });
  await dialog.getByLabel("組別名稱").fill(name);
  await dialog.getByLabel("距離").fill("70");
  await dialog.getByLabel("弓種").click();
  await page.getByRole("option", { name: bow }).click();
  await dialog.getByRole("button", { name: "創建" }).click();
  await expect(page.getByText("組別創建成功喔~~~")).toBeVisible();
}

export async function selectGroup(page: Page, name: string, competitionId: number) {
  // GroupMenu's Button has no explicit id or ARIA popup prop. Resolve formal
  // group names from the official read API, then locate the currently selected
  // menu trigger among those real labels.
  const response = await page.request.get(`/api/competition/groups/players/${competitionId}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { groups: Array<{ group_name: string }> };
  const names = body.groups.filter((group) => group.group_name !== "unassigned").map((group) => group.group_name);
  const escaped = names.map((group) => group.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const trigger = page.getByRole("button", { name: new RegExp(`^(?:${escaped})$`) });
  await expect(trigger).toHaveCount(1);
  await trigger.click();
  const target = page.getByRole("menuitem", { name, exact: true });
  await expect(target).toBeVisible();
  await target.click();
  // GroupMenu updates the bare trigger button after the menu action.  Check
  // this visible UI state as well as the later resource-specific assertions.
  await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
}
