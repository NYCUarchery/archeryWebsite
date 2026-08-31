import { expect, test } from "@playwright/test";
import {
  buildEliminationFixture,
  registerEliminationRoutes,
} from "./eliminationFixtures";

test("進度頁：修改面板對齊隊伍、靶道、靶面並原子配置同靶道 A/B", async ({
  page,
}) => {
  const fixture = buildEliminationFixture("individual");
  await registerEliminationRoutes(page, fixture);
  const requests: unknown[] = [];
  await page.route("**/elimination/match/settings/*", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`
  );

  await expect(
    page.getByRole("button", { name: "配置靶位", exact: true })
  ).toHaveCount(0);
  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  await expect(dialog.getByRole("columnheader", { name: "隊伍" })).toBeVisible();
  await expect(dialog.getByRole("columnheader", { name: "隊員" })).toBeVisible();
  await expect(dialog.getByRole("columnheader", { name: "靶道" })).toBeVisible();
  await expect(dialog.getByRole("columnheader", { name: "靶面" })).toBeVisible();
  await dialog.getByLabel("隊伍 2 靶道").fill("3");
  await dialog.getByLabel("隊伍 1 靶面").click();
  await page.getByRole("option", { name: "A", exact: true }).click();
  await dialog.getByLabel("隊伍 2 靶面").click();
  await page.getByRole("option", { name: "B", exact: true }).click();
  await dialog.getByRole("button", { name: "儲存" }).click();

  await expect.poll(() => requests).toEqual([
    {
      placements: [
        { match_result_id: fixture.myMatchResultId, lane_number: 3, target: "A" },
        { match_result_id: fixture.opponentMatchResultId, lane_number: 3, target: "B" },
      ],
      winner_match_result_id: null,
    },
  ]);
});

test("進度頁：贏家為 match 共用單選，改側以單一原子請求儲存", async ({
  page,
}) => {
  const fixture = buildEliminationFixture("individual");
  const firstResult = fixture.elimination.stages?.[0]?.matchs?.[0]
    ?.match_results?.[0];
  if (!firstResult) throw new Error("fixture 缺少第一方 MatchResult");
  firstResult.is_winner = true;
  await registerEliminationRoutes(page, fixture);
  const settingsRequests: Array<{ method: string; path: string; body: unknown }> = [];
  await page.route("**/elimination/match/settings/*", async (route) => {
    settingsRequests.push({
      method: route.request().method(),
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON(),
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: "" });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`
  );

  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  await dialog.getByLabel("贏家").click();
  await page.getByRole("option", { name: /^隊伍 2：/ }).click();
  await dialog.getByRole("button", { name: "儲存" }).click();

  await expect.poll(() => settingsRequests).toEqual([
    {
      method: "PUT",
      path: `/api/elimination/match/settings/${fixture.matchId}`,
      body: {
        placements: [
          {
            match_result_id: fixture.myMatchResultId,
            lane_number: 3,
            target: null,
          },
          {
            match_result_id: fixture.opponentMatchResultId,
            lane_number: 5,
            target: null,
          },
        ],
        winner_match_result_id: fixture.opponentMatchResultId,
      },
    },
  ]);
});

test("進度頁：空席不可指定為贏家", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  const secondResult = fixture.elimination.stages?.[0]?.matchs?.[0]
    ?.match_results?.[1];
  if (!secondResult) throw new Error("fixture 缺少第二方 MatchResult");
  secondResult.player_set_id = undefined;
  await registerEliminationRoutes(page, fixture);

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`
  );

  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  await dialog.getByLabel("贏家").click();
  await expect(
    page.getByRole("option", { name: /^隊伍 2：/ })
  ).toBeDisabled();
});

test("進度頁：排入本階段靶道會送出完整 placement payload", async ({
  page,
}) => {
  const fixture = buildEliminationFixture("individual");
  await registerEliminationRoutes(page, fixture);
  const requests: Array<{ method: string; path: string; body: unknown }> = [];
  await page.route("**/elimination/stage/placement/*", async (route) => {
    requests.push({
      method: route.request().method(),
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON(),
    });
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`
  );

  await page.getByRole("button", { name: "設定本階段靶道" }).click();
  const dialog = page.getByRole("dialog", { name: "設定本階段靶道" });
  await dialog.getByLabel("起始靶道").fill("4");
  await dialog.getByLabel("結束靶道").fill("5");
  await dialog.getByRole("button", { name: "套用" }).click();

  await expect.poll(() => requests).toEqual([
    {
      method: "PUT",
      path: `/api/elimination/stage/placement/${fixture.elimination.stages?.[0]?.id}`,
      body: {
        start_lane_number: 4,
        end_lane_number: 5,
        mode: "one_player_set_per_target",
      },
    },
  ]);
});

test("進度頁：未計分的完整籤表 Match 仍可手動改派隊伍", async ({
  page,
}) => {
  const fixture = buildEliminationFixture("individual");
  const firstStage = fixture.elimination.stages?.[0];
  const firstMatch = firstStage?.matchs?.[0];
  if (!firstStage || !firstMatch) throw new Error("fixture 缺少第一階段對抗組");

  const emptyMatch = (matchId: number, stageId: number, resultId: number) => ({
    id: matchId,
    stage_id: stageId,
    match_results: [0, 1].map((offset) => ({
      id: resultId + offset,
      is_winner: false,
      lane_number: 0,
      match_id: matchId,
      shoot_off_score: -1,
      total_points: 0,
      match_ends: [],
    })),
  });
  fixture.elimination.bracket_seed_count = 4;
  fixture.elimination.bracket_roster_locked = false;
  fixture.elimination.player_sets?.forEach((playerSet, index) => {
    playerSet.rank = index + 1;
  });
  fixture.elimination.player_sets?.push({
    id: 9650,
    elimination_id: fixture.eliminationId,
    set_name: "後備隊伍",
    rank: 3,
    players: [],
  });
  firstStage.matchs = [firstMatch, emptyMatch(9410, firstStage.id!, 9411)];
  fixture.elimination.stages = [
    firstStage,
    {
      id: 9420,
      elimination_id: fixture.eliminationId,
      matchs: [emptyMatch(9421, 9420, 9422), emptyMatch(9424, 9420, 9425)],
    },
  ];
  await registerEliminationRoutes(page, fixture);
  const requests: unknown[] = [];
  await page.route("**/elimination/match/settings/*", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`
  );

  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  const firstTeamSelect = dialog.getByLabel("隊伍 1", { exact: true });
  await expect(firstTeamSelect).toBeEnabled();
  await firstTeamSelect.click();
  await page.getByRole("option", { name: "後備隊伍 No.3" }).click();
  await dialog.getByRole("button", { name: "儲存" }).click();

  await expect.poll(() => requests).toEqual([
    {
      placements: [
        { match_result_id: fixture.myMatchResultId, lane_number: 3, target: null },
        {
          match_result_id: fixture.opponentMatchResultId,
          lane_number: 5,
          target: null,
        },
      ],
      winner_match_result_id: null,
      player_set_ids: [9650, 9600],
    },
  ]);
});

test("進度頁：已開始且名單鎖定的對抗組仍可救援更正隊伍", async ({
  page,
}) => {
  const fixture = buildEliminationFixture("individual");
  const firstResult = fixture.elimination.stages?.[0]?.matchs?.[0]
    ?.match_results?.[0];
  if (!firstResult) throw new Error("fixture 缺少第一方 MatchResult");

  fixture.elimination.bracket_seed_count = 4;
  fixture.elimination.bracket_roster_locked = true;
  firstResult.total_points = 6;
  firstResult.is_winner = true;
  fixture.elimination.player_sets?.push({
    id: 9650,
    elimination_id: fixture.eliminationId,
    set_name: "救援隊伍",
    rank: 3,
    players: [],
  });
  await registerEliminationRoutes(page, fixture);

  const requests: unknown[] = [];
  await page.route("**/elimination/match/settings/*", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`
  );

  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  const firstTeamSelect = dialog.getByLabel("隊伍 1", { exact: true });
  await expect(firstTeamSelect).toBeEnabled();
  await firstTeamSelect.click();
  await page.getByRole("option", { name: "救援隊伍 No.3" }).click();
  await expect(
    dialog.getByText("救援更正隊伍會保留該格既有比分與勝方；系統將同步後續賽程。")
  ).toBeVisible();
  await dialog.getByRole("button", { name: "儲存" }).click();

  await expect.poll(() => requests).toEqual([
    {
      placements: [
        { match_result_id: fixture.myMatchResultId, lane_number: 3, target: null },
        {
          match_result_id: fixture.opponentMatchResultId,
          lane_number: 5,
          target: null,
        },
      ],
      winner_match_result_id: fixture.myMatchResultId,
      player_set_ids: [9650, 9600],
    },
  ]);
});

test("進度頁：未鎖定對抗樹可依 schedule 排名填入第一階段", async ({
  page,
}) => {
  const fixture = buildEliminationFixture("individual");
  fixture.elimination.bracket_seed_count = 4;
  fixture.elimination.bracket_roster_locked = false;
  fixture.elimination.player_sets?.forEach((playerSet, index) => {
    playerSet.rank = index + 1;
  });
  const firstStage = fixture.elimination.stages?.[0];
  const firstMatch = firstStage?.matchs?.[0];
  if (!firstStage || !firstMatch) {
    throw new Error("fixture 缺少第一階段對抗組");
  }
  // 四籤完整樹為第一階段兩場、最終階段金牌／銅牌各一場；使 mock
  // 的 bracket shape 與真實 sync-first-round 端點所接受的資料一致。
  const emptyMatch = (matchId: number, stageId: number, resultId: number) => ({
    id: matchId,
    stage_id: stageId,
    match_results: [0, 1].map((offset) => ({
      id: resultId + offset,
      is_winner: false,
      lane_number: 0,
      match_id: matchId,
      shoot_off_score: -1,
      total_points: 0,
      match_ends: [],
    })),
  });
  firstStage.matchs = [firstMatch, emptyMatch(9410, firstStage.id!, 9411)];
  fixture.elimination.stages = [
    firstStage,
    {
      id: 9420,
      elimination_id: fixture.eliminationId,
      matchs: [emptyMatch(9421, 9420, 9422), emptyMatch(9424, 9420, 9425)],
    },
  ];
  await registerEliminationRoutes(page, fixture);

  const syncRequests: string[] = [];
  let firstRoundSynced = false;
  await page.route(
    `**/elimination/stages/scores/medals/${fixture.eliminationId}`,
    async (route) => {
      const elimination = JSON.parse(
        JSON.stringify(fixture.elimination)
      ) as typeof fixture.elimination;
      const results = elimination.stages?.[0]?.matchs?.[0]?.match_results;
      if (results?.[0] && results[1]) {
        results[0].player_set_id = firstRoundSynced
          ? elimination.player_sets?.[0]?.id
          : undefined;
        results[1].player_set_id = firstRoundSynced
          ? elimination.player_sets?.[1]?.id
          : undefined;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(elimination),
      });
    }
  );
  await page.route(
    `**/elimination/bracket/${fixture.eliminationId}/sync-first-round`,
    async (route) => {
      syncRequests.push(route.request().method());
      firstRoundSynced = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          elimination_id: fixture.eliminationId,
          changed: true,
        }),
      });
    }
  );

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`
  );

  await expect(page.getByText(fixture.setNameMine, { exact: true })).toHaveCount(
    0
  );
  await page.getByRole("button", { name: "依排名填入第一階段" }).click();
  await expect.poll(() => syncRequests).toEqual(["POST"]);
  await expect(page.getByText(fixture.setNameMine, { exact: true })).toBeVisible();
  await expect(
    page.getByText(fixture.setNameOpponent, { exact: true })
  ).toBeVisible();
});
