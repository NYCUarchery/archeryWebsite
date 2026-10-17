import { expect, test } from "../fixtures";
import { manualScreenshot } from "../manualScreenshot";
import type { Page } from "@playwright/test";


// GameTitleBar chooses a random greeting; keep documentation images stable.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0; });
});

const competitionId = 9701;
const userId = 9702;
const groupId = 9710;
const playerId = 9720;

const waves = [
  [11, 10, 9, 9, 8, 8],
  [10, 10, 9, 9, 9, 8],
  [11, 9, 9, 9, 8, 8],
  [10, 9, 9, 9, 9, 8],
  [11, 10, 9, 9, 8, 8],
  [9, 9, 9, 9, 8, 8],
];

async function registerScoreSummaryRoutes(page: Page, asPlayer = false) {
  const player = {
    id: playerId,
    group_id: groupId,
    lane_id: 9730,
    participant_id: 9740,
    name: "選手 01",
    rank: 1,
    order: 1,
    total_score: 322,
    shoot_off_score: 0,
    rounds: [{
      id: 9750,
      player_id: playerId,
      total_score: 322,
      round_ends: waves.map((scores, endIndex) => {
        const endId = 11000 + endIndex * 10;
        return {
          id: endId,
          round_id: 9750,
          is_confirmed: true,
          round_scores: scores.map((score, arrowIndex) => ({
            id: endId + arrowIndex + 1,
            round_end_id: endId,
            score,
          })),
        };
      }),
    }],
  };
  const listedPlayer = {
    id: playerId,
    group_id: groupId,
    lane_id: 9730,
    participant_id: 9740,
    name: "選手 01",
    rank: 1,
    order: 1,
    total_score: 322,
    shoot_off_score: 0,
  };
  const competition = {
    id: competitionId,
    title: "2026 射箭公開賽",
    sub_title: "公開男子反曲弓組",
    host_id: userId,
    rounds_num: 1,
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
        group_name: "公開男子反曲弓組",
        group_range: "公開組",
        bow_type: "反曲弓",
        group_index: 1,
        players: [listedPlayer],
      },
    ],
  };
  await page.route("**/user/me", (route) => route.fulfill({ json: { id: userId } }));
  await page.route(`**/user/${userId}`, (route) => route.fulfill({
    json: { id: userId, username: "score-admin", real_name: asPlayer ? "選手 01" : "裁判" },
  }));
  await page.route(`**/participant/competition/user/${competitionId}/${userId}`, (route) => route.fulfill({
    json: [{ id: 9740, userID: userId, competitionID: competitionId, role: asPlayer ? "Player" : "Admin", status: "approved" }],
  }));
  await page.route(`**/competition/${competitionId}`, (route) => route.fulfill({ json: competition }));
  await page.route(`**/competition/groups/${competitionId}`, (route) => route.fulfill({ json: competition }));
  await page.route(`**/competition/groups/players/${competitionId}`, (route) => route.fulfill({
    json: { groups: competition.groups },
  }));
  await page.route(`**/qualification/lanes/players/${groupId}`, (route) => route.fulfill({
    json: {
      id: groupId,
      advancing_num: 1,
      start_lane: 1,
      end_lane: 1,
      lanes: [{
        id: 9730,
        competition_id: competitionId,
        qualification_id: groupId,
        lane_number: 1,
        players: [listedPlayer],
      }],
    },
  }));
  await page.route(`**/player/scores/${playerId}`, (route) => route.fulfill({ json: player }));
}

test("選手從我的比賽進入賽事並開啟切換選單", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await registerScoreSummaryRoutes(page, true);
  await page.route(`**/competition/user/${userId}/0/4`, (route) => route.fulfill({
    json: [{ id: competitionId, title: "2026 射箭公開賽", sub_title: "公開男子反曲弓組" }],
    headers: { "X-Total-Count": "1" },
  }));
  await page.route("**/qualification/lanes/players/9709", (route) => route.fulfill({
    json: { id: 9709, advancing_num: 0, lanes: [] },
  }));

  await page.goto("/my_competitions");
  await expect(page.getByRole("heading", { name: "我的比賽" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看記分板" })).toBeVisible();
  await manualScreenshot(page, "player/my-competitions", { mobile: true });

  await page.getByRole("button", { name: "查看記分板" }).click();
  await expect(page).toHaveURL(new RegExp(`/competition/${competitionId}/scoreboard/0/qualification$`));
  await expect(page.locator(".board_switch")).toHaveText("分");
  await page.getByText("未分組", { exact: true }).click();
  await page.getByText("公開男子反曲弓組", { exact: true }).last().click();
  await expect(page).toHaveURL(new RegExp(`/competition/${competitionId}/scoreboard/1/qualification$`));
  await expect(page.getByText("選手 01", { exact: true })).toBeVisible();
  await manualScreenshot(page, "player/competition-scoreboard", { mobile: true });

  await page.locator(".board_switch").click();
  await expect(page.getByRole("menuitem", { name: "紀錄分數" })).toBeVisible();
  await manualScreenshot(page, "player/competition-menu", { mobile: true });
});

async function selectPlayerForJudge(page: Page) {
  await page.goto(`/competition/${competitionId}/judge`);
  await page.getByLabel("選手姓名").fill("選手 01");
  await page.getByRole("option", { name: "選手 01" }).click();
  await expect(page.getByText("1-1", { exact: true })).toBeVisible();
}

test("選手查看完整資格賽成績", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await registerScoreSummaryRoutes(page);
  await page.goto(`/competition/${competitionId}/scoreboard/1/qualification`);
  await page.getByText("選手 01", { exact: true }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "排名1 選手 01" });
  await expect(dialog.locator(".MuiAvatar-root")).toHaveCount(36);
  await expect(dialog.getByText("總計", { exact: true })).toBeVisible();
  await manualScreenshot(page, "player/public-qualification-score", { mobile: true });
});

test("裁判查看完整資格賽成績並開啟更正", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await registerScoreSummaryRoutes(page);
  await selectPlayerForJudge(page);
  const table = page.getByTestId("qualification-score-editor-table");
  await expect(table.getByText("322", { exact: true }).first()).toBeVisible();
  await manualScreenshot(page, "judge/qualification-score", { mobile: true });

  await table.getByRole("button", { name: "編輯第1局第1波分數" }).click();
  const dialog = page.getByRole("dialog", { name: "編輯分數" });
  await expect(dialog.getByRole("button", { name: "送出", exact: true })).toBeEnabled();
  await manualScreenshot(page, "judge/qualification-score-editor", { mobile: true });
});
