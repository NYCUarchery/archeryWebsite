import { expect, test, type Page } from "@playwright/test";

const competitionId = 9701;
const userId = 9702;
const groupId = 9710;
const playerId = 9720;

type ScoreRequest = { endId: number; body: { scores: number[] } };

type QualificationRoutes = {
  playerScoreRequests: ScoreRequest[];
  playerScoreGetCount: () => number;
  holdNextPlayerScoreSave: () => void;
  releasePendingPlayerScoreSave: () => void;
  failNextPlayerScoreSave: () => void;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function scoreValue(score: number): number {
  return score === 11 ? 10 : Math.max(score, 0);
}

function refreshTotals(player: any) {
  player.total_score = 0;
  for (const round of player.rounds) {
    round.total_score = round.round_ends.reduce(
      (roundTotal: number, end: any) =>
        roundTotal + end.round_scores.reduce(
          (endTotal: number, score: any) => endTotal + scoreValue(score.score),
          0
        ),
      0
    );
    player.total_score += round.total_score;
  }
}

function buildDetailedPlayer() {
  const player = {
    id: playerId,
    group_id: groupId,
    lane_id: 9730,
    participant_id: 9740,
    name: "甲選手",
    rank: 1,
    order: 1,
    total_score: 0,
    shoot_off_score: 0,
    rounds: [
      {
        id: 9750,
        player_id: playerId,
        total_score: 0,
        // 此局故意只有三波，保護 UI 不可硬編碼第六波才輸出局計。
        round_ends: [
          {
            id: 9760,
            round_id: 9750,
            is_confirmed: true,
            round_scores: [
              { id: 9761, round_end_id: 9760, score: 11 },
              { id: 9762, round_end_id: 9760, score: 10 },
              { id: 9763, round_end_id: 9760, score: -1 },
              { id: 9764, round_end_id: 9760, score: 8 },
            ],
          },
          {
            id: 9770,
            round_id: 9750,
            is_confirmed: true,
            round_scores: [
              { id: 9771, round_end_id: 9770, score: 10 },
              { id: 9772, round_end_id: 9770, score: 10 },
              { id: 9773, round_end_id: 9770, score: 9 },
              { id: 9774, round_end_id: 9770, score: -1 },
            ],
          },
          {
            id: 9780,
            round_id: 9750,
            is_confirmed: true,
            round_scores: [
              { id: 9781, round_end_id: 9780, score: 11 },
              { id: 9782, round_end_id: 9780, score: 7 },
              { id: 9783, round_end_id: 9780, score: 7 },
              { id: 9784, round_end_id: 9780, score: 0 },
              { id: 9785, round_end_id: 9780, score: -1 },
              { id: 9786, round_end_id: 9780, score: -1 },
            ],
          },
        ],
      },
      {
        id: 9790,
        player_id: playerId,
        total_score: 0,
        round_ends: [
          {
            id: 9800,
            round_id: 9790,
            is_confirmed: true,
            round_scores: [
              { id: 9801, round_end_id: 9800, score: 10 },
              { id: 9802, round_end_id: 9800, score: -1 },
              { id: 9803, round_end_id: 9800, score: 9 },
              { id: 9804, round_end_id: 9800, score: 9 },
            ],
          },
          {
            id: 9810,
            round_id: 9790,
            is_confirmed: false,
            round_scores: [
              { id: 9811, round_end_id: 9810, score: 11 },
              { id: 9812, round_end_id: 9810, score: 10 },
              { id: 9813, round_end_id: 9810, score: 0 },
              { id: 9814, round_end_id: 9810, score: 0 },
            ],
          },
        ],
      },
    ],
  };
  refreshTotals(player);
  return player;
}

async function registerQualificationRoutes(page: Page): Promise<QualificationRoutes> {
  const serverPlayer = buildDetailedPlayer();
  const playerScoreRequests: ScoreRequest[] = [];
  let playerScoreGets = 0;
  let holdNextPlayerScoreSave = false;
  let failNextPlayerScoreSave = false;
  let releasePendingPlayerScoreSave: (() => void) | undefined;

  const competition = {
    id: competitionId,
    title: "資格賽分數摘要 E2E",
    sub_title: "mock",
    host_id: userId,
    rounds_num: 2,
    unassigned_group_id: 9709,
    groups_num: 1,
    unassigned_lane_id: 9708,
    lanes_num: 1,
    current_phase: 0,
    qualification_current_end: 0,
    qualification_is_active: true,
    elimination_is_active: false,
    team_elimination_is_active: false,
    mixed_elimination_is_active: false,
    script: "",
    groups: [
      {
        id: 9709,
        competition_id: competitionId,
        group_name: "未分組",
        group_range: "",
        bow_type: "",
        group_index: 0,
        players: [],
      },
      {
        id: groupId,
        competition_id: competitionId,
        group_name: "測試反曲弓組",
        group_range: "公開組",
        bow_type: "反曲弓",
        group_index: 1,
        players: [
          {
            id: playerId,
            group_id: groupId,
            lane_id: 9730,
            participant_id: 9740,
            name: "甲選手",
            rank: 1,
            order: 1,
            total_score: serverPlayer.total_score,
            shoot_off_score: 0,
          },
        ],
      },
    ],
  };

  await page.route("**/user/me", async (route) => {
    await route.fulfill({ json: { id: userId } });
  });
  await page.route(`**/user/${userId}`, async (route) => {
    await route.fulfill({ json: { id: userId, username: "score-admin", real_name: "分數管理員" } });
  });
  await page.route(`**/participant/competition/user/${competitionId}/${userId}`, async (route) => {
    await route.fulfill({
      json: [{ id: 9740, userID: userId, competitionID: competitionId, role: "Admin", status: "approved" }],
    });
  });
  await page.route(`**/competition/${competitionId}`, async (route) => {
    await route.fulfill({ json: competition });
  });
  await page.route(`**/competition/groups/${competitionId}`, async (route) => {
    await route.fulfill({ json: competition });
  });
  await page.route(`**/competition/groups/players/${competitionId}`, async (route) => {
    // PATCH 成功後，下次頁面資料亦需反映 backend 重算後的選手總計。
    competition.groups[1].players[0].total_score = serverPlayer.total_score;
    await route.fulfill({ json: { groups: competition.groups } });
  });
  await page.route(`**/qualification/lanes/players/${groupId}`, async (route) => {
    await route.fulfill({
      json: {
        id: groupId,
        advancing_num: 1,
        start_lane: 1,
        end_lane: 1,
        lanes: [
          {
            id: 9730,
            competition_id: competitionId,
            qualification_id: groupId,
            lane_number: 1,
            players: [
              {
                id: playerId,
                group_id: groupId,
                lane_id: 9730,
                participant_id: 9740,
                name: "甲選手",
                rank: 1,
                order: 1,
                total_score: serverPlayer.total_score,
                shoot_off_score: 0,
              },
            ],
          },
        ],
      },
    });
  });
  await page.route(`**/player/scores/${playerId}`, async (route) => {
    playerScoreGets += 1;
    await route.fulfill({ json: clone(serverPlayer) });
  });
  await page.route("**/player/all-endscores/*", async (route) => {
    const endId = Number(route.request().url().split("/").pop());
    const body = route.request().postDataJSON() as { scores: number[] };
    playerScoreRequests.push({ endId, body });
    if (failNextPlayerScoreSave) {
      failNextPlayerScoreSave = false;
      await route.fulfill({ status: 500, json: { error: "mock 儲存失敗" } });
      return;
    }
    if (holdNextPlayerScoreSave) {
      holdNextPlayerScoreSave = false;
      await new Promise<void>((resolve) => {
        releasePendingPlayerScoreSave = resolve;
      });
      releasePendingPlayerScoreSave = undefined;
    }
    const end = serverPlayer.rounds
      .flatMap((round: any) => round.round_ends)
      .find((roundEnd: any) => roundEnd.id === endId);
    if (!end) {
      await route.fulfill({ status: 404, json: { message: "round end not found" } });
      return;
    }
    end.round_scores.forEach((roundScore: any, index: number) => {
      roundScore.score = body.scores[index];
    });
    refreshTotals(serverPlayer);
    await route.fulfill({ status: 200, json: null });
  });
  await page.route("**/player/isconfirmed/*", async (route) => {
    const endId = Number(route.request().url().split("/").pop());
    const body = route.request().postDataJSON() as { is_confirmed: boolean };
    const end = serverPlayer.rounds
      .flatMap((round: any) => round.round_ends)
      .find((roundEnd: any) => roundEnd.id === endId);
    if (!end) {
      await route.fulfill({ status: 404, json: { message: "round end not found" } });
      return;
    }
    end.is_confirmed = body.is_confirmed;
    await route.fulfill({ status: 200, json: null });
  });

  return {
    playerScoreRequests,
    playerScoreGetCount: () => playerScoreGets,
    holdNextPlayerScoreSave: () => {
      holdNextPlayerScoreSave = true;
    },
    releasePendingPlayerScoreSave: () => {
      if (!releasePendingPlayerScoreSave) {
        throw new Error("No pending player score save to release");
      }
      releasePendingPlayerScoreSave();
    },
    failNextPlayerScoreSave: () => {
      failNextPlayerScoreSave = true;
    },
  };
}

async function gotoPublicQualificationScoreboard(page: Page) {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(`${baseUrl}/competition/${competitionId}/scoreboard/1/qualification`);
  await page.getByText("甲選手", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "排名1 甲選手" })).toBeVisible();
}

async function selectPlayerForScoreEditing(page: Page) {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(`${baseUrl}/competition/${competitionId}/judge`);
  await page.getByLabel("選手姓名").fill("甲");
  await page.getByRole("option", { name: "甲選手" }).click();
  await expect(page.getByText("1-1", { exact: true })).toBeVisible();
}

function statisticRow(scope: ReturnType<Page["getByRole"]>, index: number) {
  return scope.getByText("Total", { exact: true }).nth(index).locator("..");
}

test.describe("Qualification score summaries", () => {
  test("公開分數榜詳情將 X、10、未填箭與波／局／全場總計正確分開", async ({ page }) => {
    await registerQualificationRoutes(page);
    await gotoPublicQualificationScoreboard(page);

    const dialog = page.getByRole("dialog").filter({ hasText: "排名1 甲選手" });
    // fixture: X=3、10=5、Total=129；-1 不可算入其中任一統計。
    await expect(statisticRow(dialog, 2)).toHaveText(/X\s*3\s*10\s*5\s*Total\s*129/);

    // 兩個局統計列亦須維持 X／10 分開；第一局只有三波，不能依第六波決定是否顯示。
    await expect(statisticRow(dialog, 0)).toHaveText(/X\s*2\s*10\s*3\s*Total\s*81/);
    await expect(statisticRow(dialog, 1)).toHaveText(/X\s*1\s*10\s*2\s*Total\s*48/);
    await expect(dialog.getByText("總計", { exact: true })).toBeVisible();
  });

  test("裁判編輯顯示最後一波後的局計與全場總計，儲存後以 refetch 重算", async ({ page }) => {
    const routes = await registerQualificationRoutes(page);
    await selectPlayerForScoreEditing(page);

    const table = page.getByRole("table");
    // 第一局只有 3 波，局計必須緊接末波而非等待固定第 6 波。
    await expect(table.getByText("1-3", { exact: true })).toBeVisible();
    await expect(table.getByText("81", { exact: true })).toBeVisible();
    await expect(table.getByText("48", { exact: true })).toBeVisible();
    await expect(table.getByText("129", { exact: true })).toBeVisible();
    await expect(statisticRow(table, 0)).toHaveText(/X\s*2\s*10\s*3\s*Total\s*81/);
    await expect(statisticRow(table, 1)).toHaveText(/X\s*1\s*10\s*2\s*Total\s*48/);
    await expect(statisticRow(table, 2)).toHaveText(/X\s*3\s*10\s*5\s*Total\s*129/);

    await table.getByRole("button", { name: "編輯第1局第1波分數" }).click();
    const editDialog = page.getByRole("dialog", { name: "編輯分數" });
    await editDialog.getByRole("button", { name: "9", exact: true }).click();
    await editDialog.getByRole("button", { name: "送出", exact: true }).click();

    await expect.poll(() => routes.playerScoreRequests).toEqual([
      { endId: 9760, body: { scores: [11, 10, 9, 8] } },
    ]);
    // server mock 已以 X=10 重算：補回原本 -1 的 9 分，第一局為 90、全場為 138；重抓才可同步畫面。
    await expect.poll(() => routes.playerScoreGetCount()).toBe(2);
    await expect(table.getByText("90", { exact: true })).toBeVisible();
    await expect(table.getByText("138", { exact: true })).toBeVisible();
  });

  test("390px 裁判資格賽沿用桌機表格，箭分、統計與操作均不橫向溢出", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await registerQualificationRoutes(page);
    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
    await page.goto(`${baseUrl}/competition/${competitionId}/judge`);
    await page.getByLabel("選手姓名").fill("甲");
    await page.getByRole("option", { name: "甲選手" }).click();

    const table = page.getByTestId("qualification-score-editor-table");
    await expect(table).toBeVisible();
    expect(await table.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(table.getByText("1-1", { exact: true })).toBeVisible();
    await expect(table.getByText("28", { exact: true }).first()).toBeVisible();
    await expect(table).toContainText(/X\s*2\s*10\s*3\s*Total\s*81/);
    await expect(table).toContainText(/X\s*3\s*10\s*5\s*Total\s*129/);
    await expect(table.getByRole("button", { name: "編輯第1局第1波分數" })).toBeVisible();
    // 六箭波含兩個未填占位；所有格子必須落在同一列，不能因手機寬度換行。
    const sixArrowEnd = table.getByTestId("qualification-end-scores-9780");
    const sixArrowSlots = sixArrowEnd.locator(
      ".score_block, .qualification-score-placeholder",
    );
    await expect(sixArrowSlots).toHaveCount(6);
    const sixArrowSlotBoxes = await sixArrowSlots.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect()),
    );
    expect(new Set(sixArrowSlotBoxes.map((bounds) => Math.round(bounds.top))).size).toBe(1);
    const [lastRoundOneEnd, firstRoundTwoEnd] = await Promise.all([
      table.getByText("1-3", { exact: true }).boundingBox(),
      table.getByText("2-1", { exact: true }).boundingBox(),
    ]);
    if (!lastRoundOneEnd || !firstRoundTwoEnd) {
      throw new Error("手機資格賽表格未取得位置");
    }
    expect(lastRoundOneEnd.y).toBeLessThan(firstRoundTwoEnd.y);

    await table.getByRole("button", { name: "編輯第1局第3波分數" }).click();
    const editDialog = page.getByRole("dialog", { name: "編輯分數" });
    await expect(editDialog).toBeVisible();
    const dialogScoreSlots = editDialog.locator(
      ".score_block, .qualification-score-placeholder",
    );
    await expect(dialogScoreSlots).toHaveCount(6);
    const dialogScoreSlotBoxes = await dialogScoreSlots.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect()),
    );
    expect(new Set(dialogScoreSlotBoxes.map((bounds) => Math.round(bounds.top))).size).toBe(1);
    expect(
      await editDialog.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        return (
          node.scrollWidth <= node.clientWidth &&
          bounds.left >= 0 &&
          bounds.right <= window.innerWidth
        );
      }),
    ).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("返回會保留本地草稿，不寫入也不重新抓取", async ({ page }) => {
    const routes = await registerQualificationRoutes(page);
    await selectPlayerForScoreEditing(page);

    const table = page.getByRole("table");
    await table.getByRole("button", { name: "編輯第1局第1波分數" }).click();
    const editDialog = page.getByRole("dialog", { name: "編輯分數" });
    await editDialog.getByRole("button", { name: "9", exact: true }).click();
    await editDialog.getByRole("button", { name: "保留草稿並返回", exact: true }).click();

    expect(routes.playerScoreRequests).toEqual([]);
    expect(routes.playerScoreGetCount()).toBe(1);
    await expect(page.getByText("請先送出或放棄目前草稿後再編輯其他波次。")).toHaveCount(0);
    await expect(page.getByText("1-1", { exact: true })).toBeVisible();
    await expect(table.getByText("28", { exact: true }).first()).toBeVisible();
    await expect(table.getByText("81", { exact: true })).toBeVisible();
    await expect(table.getByText("129", { exact: true })).toBeVisible();

    await table.getByRole("button", { name: "編輯第1局第1波分數" }).click();
    await expect(editDialog.locator(".score_block").nth(2)).toHaveText("9");
  });

  test("儲存失敗保留草稿，未確認波成功確認後重開呈已確認", async ({ page }) => {
    const routes = await registerQualificationRoutes(page);
    await selectPlayerForScoreEditing(page);

    const table = page.getByRole("table");
    await table.getByRole("button", { name: "編輯第1局第1波分數" }).click();
    const editDialog = page.getByRole("dialog", { name: "編輯分數" });
    await editDialog.getByRole("button", { name: "9", exact: true }).click();
    routes.failNextPlayerScoreSave();
    await editDialog.getByRole("button", { name: "送出", exact: true }).click();
    await expect(editDialog.getByText("mock 儲存失敗")).toBeVisible();
    await expect(editDialog.locator(".score_block").nth(2)).toHaveText("9");

    await editDialog.getByRole("button", { name: "保留草稿並返回", exact: true }).click();
    await table.getByRole("button", { name: "編輯第1局第1波分數" }).click();
    await expect(editDialog.locator(".score_block").nth(2)).toHaveText("9");
    page.once("dialog", (dialog) => dialog.accept());
    await editDialog.getByRole("button", { name: "放棄草稿", exact: true }).click();

    await table.getByRole("button", { name: "編輯第2局第2波分數" }).click();
    await expect(editDialog.getByRole("button", { name: "確認", exact: true })).toBeVisible();
    await editDialog.getByRole("button", { name: "確認", exact: true }).click();
    await expect(editDialog).not.toBeVisible();
    await expect.poll(() => routes.playerScoreGetCount()).toBe(2);

    await table.getByRole("button", { name: "編輯第2局第2波分數" }).click();
    await expect(editDialog.getByText("已確認（改分後維持確認）")).toBeVisible();
    await expect(editDialog.getByRole("button", { name: "確認", exact: true })).toHaveCount(0);
  });

  test("儲存中不可取消或以 Escape／backdrop 關閉，完成後才關閉並剛好重抓一次", async ({
    page,
  }) => {
    const routes = await registerQualificationRoutes(page);
    await selectPlayerForScoreEditing(page);

    const table = page.getByRole("table");
    await table.getByRole("button", { name: "編輯第1局第1波分數" }).click();
    const editDialog = page.getByRole("dialog", { name: "編輯分數" });
    await editDialog.getByRole("button", { name: "9", exact: true }).click();
    routes.holdNextPlayerScoreSave();
    await editDialog.getByRole("button", { name: "送出", exact: true }).click();
    await expect.poll(() => routes.playerScoreRequests).toHaveLength(1);

    await expect(editDialog.getByRole("button", { name: "保留草稿並返回", exact: true })).toBeDisabled();
    await expect(editDialog.getByRole("button", { name: "送出", exact: true })).toBeDisabled();
    await expect(editDialog.getByRole("button", { name: "8", exact: true })).toBeDisabled();
    await expect(editDialog.getByTestId("BackspaceIcon").locator("..")).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(editDialog).toBeVisible();
    await page
      .locator(".MuiDialog-container")
      .last()
      .click({ position: { x: 5, y: 5 } });
    await expect(editDialog).toBeVisible();

    routes.releasePendingPlayerScoreSave();
    await expect(editDialog).not.toBeVisible();
    await expect.poll(() => routes.playerScoreGetCount()).toBe(2);
  });
});
