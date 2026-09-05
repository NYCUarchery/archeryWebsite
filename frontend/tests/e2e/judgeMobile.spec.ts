import { expect, test } from "@playwright/test";
import {
  buildEliminationFixture,
  registerEliminationRoutes,
} from "./eliminationFixtures";

test.describe("Judge mobile scoring page", () => {
  test("360px：Admin 亦使用直向逐波比分，無水平溢位", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    const fixture = buildEliminationFixture("team", { targets: ["A", "B"] });
    const [firstSet, secondSet] = fixture.elimination.player_sets ?? [];
    if (firstSet) firstSet.set_name = "極長且無空白的測試隊伍名稱ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (secondSet) secondSet.set_name = "另一支極長且無空白的測試隊伍名稱ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    fixture.participants[0].role = "Admin";
    fixture.participants[0].status = "approved";
    await registerEliminationRoutes(page, fixture);
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
    await page.goto(`${baseUrl}/competition/${fixture.competitionId}/judge`);
    await page.getByRole("button", { name: /Match 1/ }).click();
    const comparison = page.getByTestId("elimination-match-score-comparison");
    expect(await comparison.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("桌機：維持雙方－波次－雙方三欄對照", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    const fixture = buildEliminationFixture("individual", { targets: ["A", "B"] });
    fixture.participants[0].role = "Judge";
    fixture.participants[0].status = "approved";
    await registerEliminationRoutes(page, fixture);
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
    await page.goto(`${baseUrl}/competition/${fixture.competitionId}/judge`);
    await page.getByRole("button", { name: /Match 1/ }).click();
    await expect(page.getByTestId("match-score-end-1-side-1")).toBeVisible();
    await expect(page.getByTestId("match-score-end-1-side-2")).toBeVisible();
    const [side1, wave, side2] = await Promise.all([
      page.getByTestId("match-score-end-1-side-1").boundingBox(),
      page.getByTestId("match-score-wave-1").getByLabel("第 1 波").boundingBox(),
      page.getByTestId("match-score-end-1-side-2").boundingBox(),
    ]);
    if (!side1 || !wave || !side2) throw new Error("桌機比分欄位未取得位置");
    expect(side1.x).toBeLessThan(wave.x);
    expect(wave.x).toBeLessThan(side2.x);
  });

  test("390px：乾淨裁判殼、啟用項目、確認波重編與草稿", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const fixture = buildEliminationFixture("individual", { targets: ["A", "B"] });
    fixture.participants[0].role = "Judge";
    fixture.participants[0].status = "approved";
    fixture.competition.unassigned_group_id = 9999;
    fixture.eliminationsByGroup.group_data = [
      {
        group_id: 9300,
        group_name: "啟用組",
        elimination_data: [{ elimination_id: fixture.eliminationId, team_size: 1 }],
      },
      {
        group_id: 9301,
        group_name: "停用團體組",
        elimination_data: [{ elimination_id: fixture.eliminationId + 1, team_size: 3 }],
      },
      {
        group_id: 9999,
        group_name: "未分組",
        elimination_data: [{ elimination_id: fixture.eliminationId, team_size: 1 }],
      },
    ];
    const confirmedEnd = fixture.elimination.stages?.[0].matchs?.[0]
      .match_results?.[0].match_ends?.[0];
    if (!confirmedEnd) throw new Error("fixture missing judge match end");
    confirmedEnd.is_confirmed = true;

    const handles = await registerEliminationRoutes(page, fixture);
    handles.setScoresShouldFail(true);
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
    await page.goto(`${baseUrl}/competition/${fixture.competitionId}/judge`);

    await expect(page.locator(".top_bar")).toHaveCount(0);
    await expect(page.getByRole("tab")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "判", exact: true })).toBeVisible();
    await page.getByLabel("組別").click();
    await expect(page.getByRole("option", { name: "啟用組" })).toBeVisible();
    await expect(page.getByRole("option", { name: "停用團體組" })).toHaveCount(0);
    await expect(page.getByRole("option", { name: "未分組" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.getByLabel("項目").click();
    await expect(page.getByRole("option", { name: "個人對抗賽" })).toBeVisible();
    await page.keyboard.press("Escape");

    const match = page.getByRole("button", { name: /Match 1/ });
    await expect(match).toContainText("我方");
    await expect(match).toContainText("對手");
    await expect(match).toContainText("3A");
    await expect(match).toContainText("3B");
    await match.click();
    await expect(page.getByTestId("elimination-match-score-comparison")).toBeVisible();
    await expect(page.getByTestId("match-score-wave-1")).toContainText("第 1 波");
    await expect(page.getByTestId("match-score-wave-1")).toContainText("我方");
    await expect(page.getByTestId("match-score-wave-1")).toContainText("對手");
    const comparison = page.getByTestId("elimination-match-score-comparison");
    expect(await comparison.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const [wave, side1, side2] = await Promise.all([
      page.getByTestId("match-score-wave-1").getByText("第 1 波", { exact: true }).boundingBox(),
      page.getByTestId("match-score-wave-1").getByTestId("match-score-end-1-side-1").boundingBox(),
      page.getByTestId("match-score-wave-1").getByTestId("match-score-end-1-side-2").boundingBox(),
    ]);
    if (!wave || !side1 || !side2) throw new Error("手機比分波次未取得位置");
    expect(wave.y).toBeLessThan(side1.y);
    expect(side1.y).toBeLessThan(side2.y);
    await expect(page.locator('[data-current-end="true"]:visible')).toHaveCount(2);

    const confirmedCell = page.locator('[data-status="confirmed"]:visible').first();
    await expect(confirmedCell.getByRole("button", { name: "已確認" })).toBeDisabled();
    await confirmedCell.getByRole("button", { name: "編輯本波分數" }).click();
    await expect(page.getByText("已確認（改分後維持確認）")).toBeVisible();
    await page.getByRole("button", { name: "9", exact: true }).click();
    await page.getByRole("button", { name: "送出", exact: true }).click();
    await expect(page.getByRole("button", { name: "保留草稿並返回" })).toBeVisible();
    expect(handles.savedScoreRequests).toHaveLength(1);
    const body = handles.savedScoreRequests[0].body as { match_score_ids: number[]; scores: number[] };
    expect(body.match_score_ids).toHaveLength(fixture.capacity);
    expect(body.scores).toHaveLength(fixture.capacity);
    expect(handles.confirmRequests).toHaveLength(0);

    await page.getByRole("button", { name: "保留草稿並返回" }).click();
    await expect(page.getByText("此波草稿尚未儲存；範圍切換已暫停。")).toBeVisible();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "放棄草稿" }).click();
    await expect(page.getByText("此波草稿尚未儲存；範圍切換已暫停。")).toHaveCount(0);
  });
});
