import { test, expect } from "./fixtures";
import { gotoQualificationScoreboard, legacyCompetition, legacyTitles } from "./legacy";
import { loginUser } from "./utils";

const fixtureAdmin = { username: "Oatmeal", password: "Waaaaaaaa" };
const recorder = { username: "1C", password: "1c1c1c1c" };
const viewer = { username: "1B", password: "1b1b1b1b" };

test.use({ databaseFixture: "legacy" });

test.describe("Recording Board", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, recorder);
    await gotoRecordingBoard(page);
  });

  test("pre-competition prompt", async ({ page }) => {
    await gotoQualificationScoreboard(page, legacyTitles.registered);
    await openScoreboardMenu(page, "紀錄分數");
    await expect(page.getByRole("heading", { name: "還沒開始，我知道你很急但你先別急。" })).toBeVisible();
  });

  test("lane player names", async ({ page }) => {
    for (const name of ["吳柏橙", "蕭邦聿", "盧均祐"]) await expect(playerButton(page, name)).toBeVisible();
    await expectPlayerEnd(page, "李峻", true, 44, [9, 9, 9, 7, 6, 4]);
  });

  test("score editing", async ({ page }) => {
    await unconfirmAndReturn(page);
    const competition = await legacyCompetition(page, legacyTitles.qualificationFinished);
    await page.goto(`/competition/${competition.id}/scoring`);
    await selectPlayerAndClearEnd(page, "李峻");
    await enterScores(page, [9, 9, 9, 7, 6, 4]);
    await expectPlayerEnd(page, "李峻", false, 44, [9, 9, 9, 7, 6, 4]);
  });

  test("confirmations", async ({ page }) => {
    await unconfirmAndReturn(page);
    for (const player of [
      { name: "李峻", total: 44, scores: [9, 9, 9, 7, 6, 4] },
      { name: "吳柏橙", total: 44, scores: [9, 9, 8, 7, 6, 5] },
      { name: "盧均祐", total: 45, scores: [9, 8, 8, 8, 6, 6] },
      { name: "蕭邦聿", total: 48, scores: [9, 8, 8, 8, 8, 7] },
    ]) {
      await playerButton(page, player.name).click();
      await page.getByRole("button", { name: "確認" }).click();
      await expectPlayerEnd(page, player.name, true, player.total, player.scores);
    }
  });

  test("score syncing across player accounts", async ({ browser, page }) => {
    await unconfirmAndReturn(page);
    await selectPlayerAndClearEnd(page, "吳柏橙");
    await enterScores(page, [6, 6, 6]);
    await page.getByRole("button", { name: "送出" }).click();
    const viewerContext = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL });
    const viewerPage = await viewerContext.newPage();
    await loginUser(viewerPage, viewer);
    await gotoRecordingBoard(viewerPage);
    await expectPlayerEnd(viewerPage, "吳柏橙", false, 18, [6, 6, 6, -1, -1, -1]);
    await viewerContext.close();
  });

  test("fixed score sequences keep ranking updates observable", async ({ browser, page }) => {
    test.setTimeout(120_000);
    const adminContext = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL });
    const adminPage = await adminContext.newPage();
    await unconfirm(adminPage);
    await gotoRecordingBoard(page);
    for (const sequence of [
      { player: "吳柏橙", scores: [9, 8, 7, 6, 5, 4], row: "吳柏橙", total: "705" },
      { player: "李峻", scores: [9, 9, 7, 6, 5, 4], row: "李峻", total: "723" },
    ]) {
      await playerButton(page, sequence.player).click();
      await clearCurrentEnd(page);
      await enterScores(page, sequence.scores);
      await page.getByRole("button", { name: "送出" }).click();
      await updateRanking(adminPage);
      await gotoQualificationScoreboard(page);
      await openScoreboardMenu(page, "分數榜");
      await expect(page.getByText(sequence.row, { exact: true }).locator("xpath=..").getByText(sequence.total, { exact: true })).toBeVisible();
      await gotoRecordingBoard(page);
    }
    await adminContext.close();
  });
});

type Page = import("@playwright/test").Page;
async function gotoRecordingBoard(page: Page) { await gotoQualificationScoreboard(page); await openScoreboardMenu(page, "紀錄分數"); }
async function openScoreboardMenu(page: Page, name: string) { await page.getByRole("button", { name: "分" }).click(); await page.getByRole("menuitem", { name }).click(); }
async function unconfirm(page: Page) {
  await loginUser(page, fixtureAdmin);
  await gotoQualificationScoreboard(page);
  await openScoreboardMenu(page, "監控");
  await page.getByRole("tab", { name: "進度" }).click();
  for (const lane of ["1C", "1B", "1A", "1D"]) await page.getByText(lane, { exact: true }).click();
}
async function unconfirmAndReturn(page: Page) {
  const browser = page.context().browser();
  if (!browser) throw new Error("錄分 context 缺少 browser");
  const adminContext = await browser.newContext({ baseURL: new URL(page.url()).origin });
  const adminPage = await adminContext.newPage();
  await unconfirm(adminPage);
  await adminContext.close();
  await page.reload();
  await gotoRecordingBoard(page);
}
async function clearCurrentEnd(page: Page) { for (let index = 0; index < 6; index++) await page.locator("div").filter({ hasText: /^確認送出$/ }).getByRole("button").nth(2).click(); }
function playerButton(page: Page, name: string) { return page.getByRole("button").filter({ hasText: name }); }
async function expectPlayerEnd(page: Page, name: string, confirmed: boolean, total: number, scores: number[]) {
  const button = playerButton(page, name);
  await expect(button).toContainText(confirmed ? "✔" : "-");
  await expect(button).toContainText(String(total));
  await expect.poll(() => button.locator(".score_block").allTextContents()).toEqual(scores.map(String));
}
async function selectPlayerAndClearEnd(page: Page, name: string) { await playerButton(page, name).click(); await clearCurrentEnd(page); }
async function enterScores(page: Page, scores: number[]) { for (const score of scores) await page.getByRole("button", { name: String(score), exact: true }).click(); }
async function updateRanking(page: Page) { await page.getByRole("button", { name: "更新排名" }).click(); }
