import type { Page } from "@playwright/test";
import type { DatabaseElimination, DatabaseMatchEnd } from "@/types/Api";
import { expect, test } from "./fixtures";
import {
  buildEliminationFixture,
  eliminationProgressResponse,
  registerEliminationRoutes,
  type EliminationFixture,
  type EliminationVariant,
} from "./eliminationFixtures";

const SCORE_LABELS = ["X", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1", "M"];

function results(elimination: DatabaseElimination) {
  return elimination.stages![0].matchs![0].match_results!;
}

function finishedFixture(variant: EliminationVariant) {
  const fixture = buildEliminationFixture(variant);
  fixture.competition.groups![0].bow_type = "Recurve";
  fixture.elimination.current_end = 2;
  fixture.elimination.stages![0].matchs![0].outcome_status = "winner";
  results(fixture.elimination).forEach((result, side) => {
    const template = result.match_ends![0];
    result.is_winner = side === 0;
    result.total_points = side === 0 ? (variant === "individual" ? 6 : 5) : (variant === "individual" ? 0 : 1);
    result.match_ends = Array.from({ length: 3 }, (_, index): DatabaseMatchEnd => {
      const tie = variant !== "individual" && index === 2;
      const arrowScore = side === 0 || tie ? 10 : 9;
      return {
        ...template,
        id: template.id! - (2 - index) * 1000,
        is_confirmed: index < 2,
        total_scores: fixture.capacity * arrowScore,
        points: tie ? 1 : side === 0 ? 2 : 0,
        cumulative_points: side === 0 ? (index + 1) * 2 - (tie ? 1 : 0) : tie ? 1 : 0,
        match_scores: template.match_scores!.map((score) => ({
          id: score.id! - (2 - index) * 1000,
          score: arrowScore,
        })),
      };
    });
  });
  return fixture;
}

async function gotoScoring(page: Page, fixture: EliminationFixture) {
  await page.goto(`/competition/${fixture.competitionId}/scoring`);
  await expect(page.locator(".match_result_button_group")).toBeVisible();
}

async function expectClosed(page: Page) {
  await expect(page.getByText("本場對抗已結束", { exact: true })).toBeVisible();
  await expect(page.getByText("勝者：我方", { exact: true })).toBeVisible();
  for (const label of SCORE_LABELS) {
    await expect(page.getByRole("button", { name: label, exact: true })).toHaveCount(0);
  }
  await expect(page.getByRole("button", { name: "送出", exact: true })).toHaveCount(0);
  await expect(page.locator(".controll_button_group")).toHaveCount(0);
}

async function mockRemoteDetail(page: Page, fixture: EliminationFixture) {
  const remote = structuredClone(fixture.elimination);
  await page.route(`**/elimination/stages/scores/medals/${fixture.eliminationId}`, async (route) => {
    await route.fulfill({ json: remote });
  });
  await page.route(`**/elimination/${fixture.eliminationId}`, async (route) => {
    await route.fulfill({
      json: eliminationProgressResponse(remote, fixture.competition.groups?.[0].bow_type),
    });
  });
  return remote;
}

test.describe("Elimination scoring closure", () => {
  test("複合弓已有勝者仍可填分", async ({ page }) => {
    const fixture = finishedFixture("individual");
    fixture.competition.groups![0].bow_type = "Compound";
    await registerEliminationRoutes(page, fixture);
    await page.goto(`/competition/${fixture.competitionId}/scoring`);
    await expect(page.locator(".match_result_button_group")).toBeVisible();
    await expect(page.getByText("本場對抗已結束", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "送出", exact: true })).toBeVisible();
  });

  for (const variant of ["individual", "mixed", "team"] as const) {
    test(`反曲 ${variant}：既有勝者關閉填分，決勝波仍可確認`, async ({ page }) => {
      const fixture = finishedFixture(variant);
      const handles = await registerEliminationRoutes(page, fixture);
      await gotoScoring(page, fixture);
      await expectClosed(page);
      const mine = page.locator(".match_result_button").filter({ hasText: fixture.setNameMine });
      await expect(mine.locator(".match_total")).toHaveAttribute("aria-label", `總積點：${variant === "individual" ? 6 : 5}`);
      await expect(mine.locator(".match_total_score")).toHaveText(String(fixture.capacity * 10));

      await page.getByRole("button", { name: "確認本波", exact: true }).click();
      await expect.poll(() => handles.confirmRequests.length).toBe(1);
      expect(handles.confirmRequests[0].url).toContain(`/isconfirmed/${fixture.myMatchEndId}`);
      expect(handles.getMatchEndState(fixture.myMatchEndId)?.is_confirmed).toBe(true);
      await expect(page.getByRole("button", { name: "確認本波", exact: true })).toHaveCount(0);
      expect(handles.savedScoreRequests).toHaveLength(0);
      expect(handles.forbiddenRequests).toHaveLength(0);
    });
  }

  test("遠端切換弓種會重開或關閉同一勝者對局，並更新總計", async ({ page }) => {
    const fixture = finishedFixture("individual");
    const handles = await registerEliminationRoutes(page, fixture);
    await gotoScoring(page, fixture);
    await expectClosed(page);
    const mine = page.locator(".match_result_button").filter({ hasText: fixture.setNameMine });
    await expect(mine.locator(".match_total")).toHaveAttribute("aria-label", "總積點：6");

    handles.setGroupBowType("Compound");
    await expect(page.getByRole("button", { name: "送出", exact: true })).toBeVisible();
    await expect(page.getByText("本場對抗已結束", { exact: true })).toHaveCount(0);
    await expect(mine.locator(".match_total")).toHaveAttribute("aria-label", "總積分：90");
    const detailReads = handles.eliminationDetailRequests.length;
    const progressReads = handles.eliminationProgressRequests.length;
    await expect.poll(() => handles.eliminationProgressRequests.length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(progressReads + 2);
    expect(handles.eliminationDetailRequests).toHaveLength(detailReads);

    handles.setGroupBowType("Recurve");
    await expectClosed(page);
    await expect(mine.locator(".match_total")).toHaveAttribute("aria-label", "總積點：6");
    expect(handles.savedScoreRequests).toHaveLength(0);
    expect(handles.confirmRequests).toHaveLength(0);
  });

  test("決勝波確認成功後，完整資料尚未更新時維持禁按", async ({ page }) => {
    const fixture = finishedFixture("individual");
    const handles = await registerEliminationRoutes(page, fixture);
    await gotoScoring(page, fixture);
    await expectClosed(page);
    const confirm = page.getByRole("button", { name: /^(確認本波|已確認)$/ });
    let releaseDetail!: () => void;
    const detailReleased = new Promise<void>((resolve) => { releaseDetail = resolve; });
    let pendingDetailRequests = 0;
    await page.route(`**/elimination/stages/scores/medals/${fixture.eliminationId}`, async (route) => {
      pendingDetailRequests += 1;
      await detailReleased;
      await route.fallback();
    });

    try {
      const confirmed = page.waitForResponse((response) =>
        response.url().includes(`/isconfirmed/${fixture.myMatchEndId}`) && response.status() === 200);
      await confirm.click();
      await confirmed;
      await expect.poll(() => pendingDetailRequests).toBeGreaterThan(0);
      await expect(confirm).toBeDisabled();
      await page.waitForResponse((response) =>
        response.url().endsWith(`/elimination/${fixture.eliminationId}`));
      await expect(confirm).toBeDisabled();
      expect(handles.confirmRequests).toHaveLength(1);
      await expect(page.getByText("確認失敗，請稍後再試", { exact: true })).toHaveCount(0);
    } finally {
      releaseDetail();
    }
    await expect(page.getByRole("button", { name: "確認本波", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "已確認", exact: true })).toBeDisabled();
    expect(handles.confirmRequests).toHaveLength(1);
    expect(handles.savedScoreRequests).toHaveLength(0);
  });

  test("確認成功後重取失敗仍維持已確認，遠端解除後可再確認", async ({ page }) => {
    const fixture = finishedFixture("individual");
    const handles = await registerEliminationRoutes(page, fixture);
    await gotoScoring(page, fixture);
    await expectClosed(page);
    let failDetails = true;
    await page.route(`**/elimination/stages/scores/medals/${fixture.eliminationId}`, async (route) => {
      if (failDetails) {
        await route.fulfill({ status: 500, json: { error: "temporary read failure" } });
      } else {
        await route.fallback();
      }
    });

    const failedRead = page.waitForResponse((response) =>
      response.url().includes(`/stages/scores/medals/${fixture.eliminationId}`) && response.status() === 500);
    await page.getByRole("button", { name: "確認本波", exact: true }).click();
    await failedRead;
    await expect(page.getByRole("button", { name: "已確認", exact: true })).toBeDisabled();
    await expect(page.getByText("已確認本波", { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "確認本波", exact: true })).toHaveCount(0);
    expect(handles.confirmRequests).toHaveLength(1);
    await expect(page.getByText("確認失敗，請稍後再試", { exact: true })).toHaveCount(0);

    failDetails = false;
    handles.getMatchEndState(fixture.myMatchEndId)!.is_confirmed = false;
    await expect(page.getByRole("button", { name: "確認本波", exact: true })).toBeEnabled();
    expect(handles.confirmRequests).toHaveLength(1);
    expect(handles.savedScoreRequests).toHaveLength(0);
  });

  test("決勝波存分成功即關閉，僅確認端點可續送", async ({ page }) => {
    const fixture = finishedFixture("individual");
    const [mine] = results(fixture.elimination);
    mine.is_winner = false;
    mine.total_points = 4;
    mine.match_ends![2].match_scores!.forEach((score) => { score.score = -1; });
    mine.match_ends![2].total_scores = 0;
    fixture.elimination.stages![0].matchs![0].outcome_status = "incomplete";
    const handles = await registerEliminationRoutes(page, fixture);
    handles.setScoreSaveWinner(fixture.myMatchResultId);
    await gotoScoring(page, fixture);
    for (let index = 0; index < fixture.capacity; index += 1) {
      await page.getByRole("button", { name: "10", exact: true }).click();
    }
    await expectClosed(page);
    expect(handles.savedScoreRequests).toHaveLength(1);
    await page.getByRole("button", { name: "確認本波", exact: true }).click();
    await expect.poll(() => handles.confirmRequests.length).toBe(1);
    expect(handles.savedScoreRequests).toHaveLength(1);
    expect(handles.forbiddenRequests).toHaveLength(0);
  });

  test("狀態未變動時僅輪詢輕量端點，不重抓完整籤表", async ({ page }) => {
    const fixture = buildEliminationFixture("individual");
    fixture.competition.groups![0].bow_type = "Recurve";
    const handles = await registerEliminationRoutes(page, fixture);
    await gotoScoring(page, fixture);
    await expect(page.getByRole("button", { name: "送出", exact: true })).toBeVisible();
    const detailReads = handles.eliminationDetailRequests.length;
    const progressReads = handles.eliminationProgressRequests.length;

    await expect.poll(() => handles.eliminationProgressRequests.length, { timeout: 10000 })
      .toBeGreaterThanOrEqual(progressReads + 2);
    expect(handles.eliminationDetailRequests).toHaveLength(detailReads);
  });

  test("同波遠端判勝與確認會同步，無須換波或重整", async ({ page }) => {
    const fixture = finishedFixture("individual");
    results(fixture.elimination)[0].is_winner = false;
    const handles = await registerEliminationRoutes(page, fixture);
    const remote = await mockRemoteDetail(page, fixture);
    await gotoScoring(page, fixture);
    await expect(page.getByRole("button", { name: "送出", exact: true })).toBeVisible();

    results(remote)[0].is_winner = true;
    await expectClosed(page);
    await expect(page.getByRole("button", { name: "確認本波", exact: true })).toBeEnabled();
    results(remote)[0].match_ends![2].is_confirmed = true;
    await expect(page.getByRole("button", { name: "確認本波", exact: true })).toHaveCount(0);
    expect(handles.savedScoreRequests).toHaveLength(0);
    expect(handles.confirmRequests).toHaveLength(0);
  });

  test("同波輪詢保留草稿；判勝採伺服器比分，撤銷勝者不自動存分", async ({ page }) => {
    const fixture = buildEliminationFixture("individual");
    fixture.competition.groups![0].bow_type = "Recurve";
    const handles = await registerEliminationRoutes(page, fixture);
    const remote = await mockRemoteDetail(page, fixture);
    await gotoScoring(page, fixture);
    await page.getByRole("button", { name: "10", exact: true }).click();
    const mine = page.locator(".match_result_button").filter({ hasText: fixture.setNameMine });
    // A remote confirmation refreshes the full detail while our local draft stays dirty.
    const detailRefresh = page.waitForResponse((response) =>
      response.url().includes(`/stages/scores/medals/${fixture.eliminationId}`));
    results(remote)[1].match_ends![0].is_confirmed = true;
    await detailRefresh;
    await expect(mine.locator(".match_total_score")).toHaveText("10");
    results(remote)[0].is_winner = true;
    results(remote).forEach((result, side) => {
      result.match_ends![0].match_scores!.forEach((score) => { score.score = side === 0 ? 10 : 9; });
      result.match_ends![0].total_scores = fixture.capacity * (side === 0 ? 10 : 9);
    });
    await expectClosed(page);
    await expect(mine.locator(".match_total_score")).toHaveText("30");
    await expect(page.getByRole("button", { name: "確認本波", exact: true })).toBeEnabled();
    expect(handles.savedScoreRequests).toHaveLength(0);
    expect(handles.confirmRequests).toHaveLength(0);

    results(remote)[0].is_winner = false;
    await expect(page.getByRole("button", { name: "送出", exact: true })).toBeVisible();
    await expect(mine.locator(".match_total_score")).toHaveText("30");
    // Another status poll must not resubmit the restored server scores.
    await page.waitForResponse((response) => response.url().endsWith(`/elimination/${fixture.eliminationId}`));
    expect(handles.savedScoreRequests).toHaveLength(0);
  });

  test("加射待判且無勝者時仍可填分", async ({ page }) => {
    const fixture = buildEliminationFixture("individual", { outcomeStatus: "shoot_off" });
    fixture.competition.groups![0].bow_type = "反曲弓";
    const handles = await registerEliminationRoutes(page, fixture);
    await gotoScoring(page, fixture);
    await expect(page.getByText("本場對抗已結束", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "10", exact: true }).click();
    await expect(page.locator(".match_result_button").filter({ hasText: fixture.setNameMine }).locator(".match_total_score")).toHaveText("10");
    expect(handles.savedScoreRequests).toHaveLength(0);
  });

  test("已結束對局切至後續空白波，仍只確認決勝波", async ({ page }) => {
    const fixture = finishedFixture("individual");
    fixture.elimination.current_end = 3;
    results(fixture.elimination).forEach((result) => {
      const end = result.match_ends![2];
      result.match_ends!.push({
        ...end,
        id: end.id! + 1000,
        total_scores: 0,
        is_confirmed: false,
        points: null,
        match_scores: end.match_scores!.map((score) => ({ id: score.id! + 1000, score: -1 })),
      });
    });
    const handles = await registerEliminationRoutes(page, fixture);
    await gotoScoring(page, fixture);
    await expectClosed(page);
    await page.getByRole("button", { name: "確認本波", exact: true }).click();
    await expect.poll(() => handles.confirmRequests.length).toBe(1);
    expect(handles.confirmRequests[0].url).toContain(`/isconfirmed/${fixture.myMatchEndId}`);
    expect(handles.getMatchEndState(fixture.myMatchEndId + 1000)?.is_confirmed).toBe(false);
    await expect(page.getByRole("button", { name: "確認本波", exact: true })).toHaveCount(0);
  });

  test("同波撤銷勝者後恢復填分", async ({ page }) => {
    const fixture = finishedFixture("individual");
    const handles = await registerEliminationRoutes(page, fixture);
    const remote = await mockRemoteDetail(page, fixture);
    await gotoScoring(page, fixture);
    await expectClosed(page);
    results(remote)[0].is_winner = false;
    remote.stages![0].matchs![0].outcome_status = "incomplete";
    await expect(page.getByRole("button", { name: "送出", exact: true })).toBeEnabled();
    await expect(page.getByText("本場對抗已結束", { exact: true })).toHaveCount(0);
    await page.locator(".controll_button_group").getByRole("button").last().click();
    await expect(page.getByRole("button", { name: "10", exact: true })).toBeEnabled();
    expect(handles.savedScoreRequests).toHaveLength(0);
  });

  test("下一輪新對局重新開放填分", async ({ page }) => {
    const fixture = finishedFixture("individual");
    const nextStage = structuredClone(fixture.elimination.stages![0]);
    nextStage.id! += 10000;
    nextStage.matchs![0].id! += 10000;
    nextStage.matchs![0].stage_id = nextStage.id;
    nextStage.matchs![0].outcome_status = "incomplete";
    nextStage.matchs![0].match_results!.forEach((result) => {
      result.id! += 10000;
      result.match_id = nextStage.matchs![0].id;
      result.is_winner = false;
      result.total_points = 0;
      result.match_ends = [{
        id: result.id! + 1,
        match_result_id: result.id,
        is_confirmed: false,
        total_scores: 0,
        match_scores: Array.from({ length: fixture.capacity }, (_, index) => ({ id: result.id! + 10 + index, score: -1 })),
      }];
    });
    fixture.elimination.stages!.push(nextStage);
    const handles = await registerEliminationRoutes(page, fixture);
    await gotoScoring(page, fixture);
    await expectClosed(page);
    handles.setEliminationProgress(1, 0);
    await expect(page.getByRole("button", { name: "10", exact: true })).toBeEnabled();
    await expect(page.getByText("本場對抗已結束", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "10", exact: true }).click();
    await expect(page.locator(".match_result_button").filter({ hasText: fixture.setNameMine }).locator(".match_total_score")).toHaveText("10");
    expect(handles.forbiddenRequests).toHaveLength(0);
  });
});
