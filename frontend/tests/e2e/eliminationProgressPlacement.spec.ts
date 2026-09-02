import { expect, test } from "@playwright/test";
import {
  buildEliminationFixture,
  type FixtureOutcomeStatus,
  registerEliminationRoutes,
} from "./eliminationFixtures";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";

const outcomeCases: Array<{
  status: Extract<
    FixtureOutcomeStatus,
    "shoot_off" | "locked_conflict" | "unsupported_bow_type"
  >;
  testId: string;
  cardText: string;
  dialogText: string;
}> = [
  {
    status: "shoot_off",
    testId: "match-outcome-shoot-off",
    cardText: "需要加射",
    dialogText: "需要加射；請由管理員完成加射後手動指定勝方。",
  },
  {
    status: "locked_conflict",
    testId: "match-outcome-locked-conflict",
    cardText: "比分與已晉級賽果不一致",
    dialogText: "比分與已晉級賽果不一致",
  },
  {
    status: "unsupported_bow_type",
    testId: "match-outcome-unsupported-bow-type",
    cardText: "此弓種無法自動判定",
    dialogText: "此弓種無法自動判定勝方；請由管理員手動指定。",
  },
];

for (const outcomeCase of outcomeCases) {
  test(`進度頁：${outcomeCase.cardText}顯示於對抗卡及詳細面板`, async ({
    page,
  }) => {
    const fixture = buildEliminationFixture("individual", {
      outcomeStatus: outcomeCase.status,
    });
    const winnerMutations: string[] = [];
    page.on("request", (request) => {
      if (
        request.url().includes("/elimination/match/winner/") ||
        request.url().includes("/matchresult/iswinner/")
      ) {
        winnerMutations.push(request.url());
      }
    });
    await registerEliminationRoutes(page, fixture);

    await page.goto(
      `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
    );

    await expect(
      page.getByTestId(outcomeCase.testId).getByText(outcomeCase.cardText),
    ).toBeVisible();
    await expect.poll(() => winnerMutations).toEqual([]);

    await page.getByText(fixture.setNameMine, { exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "修改對抗組" });
    await expect(dialog.getByTestId(outcomeCase.testId)).toContainText(
      outcomeCase.dialogText,
    );
    await expect.poll(() => winnerMutations).toEqual([]);
  });
}

test("進度頁：單純讀取不覆寫人工指定的勝方", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  const firstResult =
    fixture.elimination.stages?.[0]?.matchs?.[0]?.match_results?.[0];
  if (!firstResult) throw new Error("fixture 缺少第一方 MatchResult");
  firstResult.is_winner = true;
  const winnerMutations: string[] = [];
  page.on("request", (request) => {
    if (
      request.url().includes("/elimination/match/winner/") ||
      request.url().includes("/matchresult/iswinner/")
    ) {
      winnerMutations.push(request.url());
    }
  });
  await registerEliminationRoutes(page, fixture);

  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );
  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  await expect(
    dialog.getByTestId("match-score-side-1").getByText("勝方", { exact: true }),
  ).toBeVisible();
  await expect.poll(() => winnerMutations).toEqual([]);
});

test("進度頁：修改面板同行顯示靶位並允許非連續靶道搭配 A/B", async ({
  page,
}) => {
  const fixture = buildEliminationFixture("individual");
  await registerEliminationRoutes(page, fixture);
  const requests: unknown[] = [];
  await page.route("**/elimination/match/settings/*", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });

  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );

  await expect(
    page.getByRole("button", { name: "配置靶位", exact: true }),
  ).toHaveCount(0);
  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  await expect(dialog.getByTestId("match-team-card-1")).toBeVisible();
  await expect(dialog.getByTestId("match-team-card-2")).toBeVisible();
  await expect(dialog.getByLabel("隊伍 1", { exact: true })).toBeVisible();
  await expect(dialog.getByLabel("隊伍 2", { exact: true })).toBeVisible();
  await expect(dialog.getByLabel("隊伍 1 靶道")).toBeVisible();
  await expect(dialog.getByLabel("隊伍 2 靶面")).toBeVisible();
  await expect(dialog.getByLabel("隊伍 1 靶道")).toHaveAttribute(
    "type",
    "text",
  );
  await expect(dialog.getByLabel("隊伍 1 靶道")).toHaveAttribute(
    "inputmode",
    "numeric",
  );
  const [team1Box, lane1Box, target1Box] = await Promise.all([
    dialog.getByLabel("隊伍 1", { exact: true }).boundingBox(),
    dialog.getByLabel("隊伍 1 靶道").boundingBox(),
    dialog.getByLabel("隊伍 1 靶面").boundingBox(),
  ]);
  if (!team1Box || !lane1Box || !target1Box)
    throw new Error("隊伍欄位未取得位置");
  const team1CenterY = team1Box.y + team1Box.height / 2;
  expect(
    Math.abs(team1CenterY - (lane1Box.y + lane1Box.height / 2)),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(team1CenterY - (target1Box.y + target1Box.height / 2)),
  ).toBeLessThanOrEqual(1);
  await dialog.getByLabel("隊伍 2 靶道").fill("8");
  await dialog.getByLabel("隊伍 1 靶面").click();
  await page.getByRole("option", { name: "A", exact: true }).click();
  await dialog.getByLabel("隊伍 2 靶面").click();
  await page.getByRole("option", { name: "B", exact: true }).click();
  await dialog.getByRole("button", { name: "儲存" }).click();

  await expect
    .poll(() => requests)
    .toEqual([
      {
        placements: [
          {
            match_result_id: fixture.myMatchResultId,
            lane_number: 3,
            target: "A",
          },
          {
            match_result_id: fixture.opponentMatchResultId,
            lane_number: 8,
            target: "B",
          },
        ],
        winner_match_result_id: null,
      },
    ]);
});

test("進度頁：贏家為 match 共用單選，改側以單一原子請求儲存", async ({
  page,
}) => {
  const fixture = buildEliminationFixture("individual");
  const firstResult =
    fixture.elimination.stages?.[0]?.matchs?.[0]?.match_results?.[0];
  if (!firstResult) throw new Error("fixture 缺少第一方 MatchResult");
  firstResult.is_winner = true;
  await registerEliminationRoutes(page, fixture);
  const settingsRequests: Array<{
    method: string;
    path: string;
    body: unknown;
  }> = [];
  await page.route("**/elimination/match/settings/*", async (route) => {
    settingsRequests.push({
      method: route.request().method(),
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON(),
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "",
    });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );

  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  await dialog.getByLabel("贏家").click();
  await page.getByRole("option", { name: /^隊伍 2：/ }).click();
  await dialog.getByRole("button", { name: "儲存" }).click();

  await expect
    .poll(() => settingsRequests)
    .toEqual([
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
  const [firstResult, secondResult] =
    fixture.elimination.stages?.[0]?.matchs?.[0]?.match_results ?? [];
  if (!firstResult || !secondResult) {
    throw new Error("fixture 缺少第一場雙方 MatchResult");
  }
  secondResult.player_set_id = undefined;
  firstResult.match_ends = [];
  secondResult.match_ends = [];
  await registerEliminationRoutes(page, fixture);

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );

  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  const comparison = dialog.getByTestId("elimination-match-score-comparison");
  await expect(
    comparison.getByTestId("match-score-side-2").getByLabel("隊伍 2", {
      exact: true,
    }),
  ).toHaveValue("");
  await expect(comparison).toContainText("尚無比分");
  await dialog.getByLabel("贏家").click();
  await expect(page.getByRole("option", { name: /^隊伍 2：/ })).toBeDisabled();
});

test("進度頁：排入本階段靶道會送出完整 placement payload", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  await registerEliminationRoutes(page, fixture);
  const requests: Array<{ method: string; path: string; body: unknown }> = [];
  await page.route("**/elimination/stage/placement/*", async (route) => {
    requests.push({
      method: route.request().method(),
      path: new URL(route.request().url()).pathname,
      body: route.request().postDataJSON(),
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );

  await page.getByRole("button", { name: "設定本階段靶道" }).click();
  const dialog = page.getByRole("dialog", { name: "設定本階段靶道" });
  await dialog.getByLabel("起始靶道").fill("4");
  await dialog.getByLabel("結束靶道").fill("5");
  await dialog.getByRole("button", { name: "套用" }).click();

  await expect
    .poll(() => requests)
    .toEqual([
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

test("進度頁：未計分的完整籤表 Match 仍可手動改派隊伍", async ({ page }) => {
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
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );

  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  const firstTeamSelect = dialog.getByLabel("隊伍 1", { exact: true });
  await expect(firstTeamSelect).toBeEnabled();
  await firstTeamSelect.click();
  await page.getByRole("option", { name: "後備隊伍 No.3" }).click();
  await dialog.getByRole("button", { name: "儲存" }).click();

  await expect
    .poll(() => requests)
    .toEqual([
      {
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
        winner_match_result_id: null,
        player_set_ids: [9650, 9600],
      },
    ]);
});

test("進度頁：已開始且名單鎖定的對抗組仍可救援更正隊伍", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  const firstResult =
    fixture.elimination.stages?.[0]?.matchs?.[0]?.match_results?.[0];
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
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );

  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  const firstTeamSelect = dialog.getByLabel("隊伍 1", { exact: true });
  await expect(firstTeamSelect).toBeEnabled();
  await firstTeamSelect.click();
  await page.getByRole("option", { name: "救援隊伍 No.3" }).click();
  await expect(
    dialog.getByText(
      "救援更正隊伍會保留該格既有比分與勝方；系統將同步後續賽程。",
    ),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "儲存" }).click();

  await expect
    .poll(() => requests)
    .toEqual([
      {
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
        winner_match_result_id: fixture.myMatchResultId,
        player_set_ids: [9650, 9600],
      },
    ]);
});

test("進度頁：未鎖定對抗樹可依 schedule 排名填入第一階段", async ({ page }) => {
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
        JSON.stringify(fixture.elimination),
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
    },
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
    },
  );

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );

  await expect(
    page.getByText(fixture.setNameMine, { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "依排名填入第一階段" }).click();
  await expect.poll(() => syncRequests).toEqual(["POST"]);
  await expect(
    page.getByText(fixture.setNameMine, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(fixture.setNameOpponent, { exact: true }),
  ).toBeVisible();
});

test("進度頁：對抗組面板以雙方對照呈現比分，並保留缺少的波次", async ({
  page,
}) => {
  const fixture = buildEliminationFixture("individual");
  const matchResults =
    fixture.elimination.stages?.[0]?.matchs?.[0]?.match_results;
  const [firstResult, secondResult] = matchResults ?? [];
  if (!firstResult || !secondResult) {
    throw new Error("fixture 缺少第一場雙方 MatchResult");
  }

  firstResult.total_points = 3;
  firstResult.shoot_off_score = 10;
  firstResult.is_winner = true;
  firstResult.match_ends = [
    {
      id: fixture.myMatchEndId,
      match_result_id: fixture.myMatchResultId,
      is_confirmed: true,
      total_scores: 10,
      points: 2,
      cumulative_points: 2,
      match_scores: [
        {
          id: fixture.myMatchScoreIds[0],
          match_end_id: fixture.myMatchEndId,
          score: 11,
        },
        {
          id: fixture.myMatchScoreIds[1],
          match_end_id: fixture.myMatchEndId,
          score: 0,
        },
        {
          id: fixture.myMatchScoreIds[2],
          match_end_id: fixture.myMatchEndId,
          score: 0,
        },
      ],
    },
    {
      id: 9301,
      match_result_id: fixture.myMatchResultId,
      is_confirmed: false,
      total_scores: 27,
      points: 1,
      cumulative_points: 3,
      match_scores: [
        { id: 9302, match_end_id: 9301, score: 10 },
        { id: 9303, match_end_id: 9301, score: 9 },
        { id: 9304, match_end_id: 9301, score: 8 },
      ],
    },
    {
      id: 9311,
      match_result_id: fixture.myMatchResultId,
      is_confirmed: false,
      total_scores: 0,
      points: null,
      cumulative_points: 3,
      match_scores: [
        { id: 9312, match_end_id: 9311, score: -1 },
        { id: 9313, match_end_id: 9311, score: -1 },
        { id: 9314, match_end_id: 9311, score: -1 },
      ],
    },
  ];
  secondResult.total_points = 1;
  secondResult.shoot_off_score = 9;
  secondResult.is_winner = false;
  // 第二方刻意缺少第三波，驗證平手後仍會為缺波補上空席。
  secondResult.match_ends = [
    {
      id: fixture.opponentMatchEndId,
      match_result_id: fixture.opponentMatchResultId,
      is_confirmed: false,
      total_scores: 9,
      points: 0,
      cumulative_points: 0,
      match_scores: [
        {
          id: fixture.opponentMatchScoreIds[0],
          match_end_id: fixture.opponentMatchEndId,
          score: 9,
        },
        {
          id: fixture.opponentMatchScoreIds[1],
          match_end_id: fixture.opponentMatchEndId,
          score: 0,
        },
        {
          id: fixture.opponentMatchScoreIds[2],
          match_end_id: fixture.opponentMatchEndId,
          score: 0,
        },
      ],
    },
    {
      id: 9321,
      match_result_id: fixture.opponentMatchResultId,
      is_confirmed: false,
      total_scores: 27,
      points: 1,
      cumulative_points: 1,
      match_scores: [
        { id: 9322, match_end_id: 9321, score: 10 },
        { id: 9323, match_end_id: 9321, score: 9 },
        { id: 9324, match_end_id: 9321, score: 8 },
      ],
    },
  ];
  await registerEliminationRoutes(page, fixture);
  await page.setViewportSize({ width: 360, height: 900 });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );

  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  await expect(
    dialog.getByText(`修改對抗組 #${fixture.matchId}`, { exact: true }),
  ).toBeVisible();
  const firstTeamCard = dialog.getByTestId("match-team-card-1");
  const secondTeamCard = dialog.getByTestId("match-team-card-2");
  await expect(firstTeamCard).toBeVisible();
  await expect(secondTeamCard).toBeVisible();

  const [firstTeamCardBox, secondTeamCardBox] = await Promise.all([
    firstTeamCard.boundingBox(),
    secondTeamCard.boundingBox(),
  ]);
  if (!firstTeamCardBox || !secondTeamCardBox) {
    throw new Error("對抗組卡片未取得可比較的位置");
  }
  expect(
    Math.abs(secondTeamCardBox.y - firstTeamCardBox.y),
  ).toBeLessThanOrEqual(1);
  expect(secondTeamCardBox.x).toBeGreaterThan(firstTeamCardBox.x);
  const comparison = dialog.getByTestId("elimination-match-score-comparison");
  await expect(comparison).toBeVisible();
  expect(
    await comparison.evaluate(
      (element) => element.scrollWidth > element.clientWidth,
    ),
  ).toBe(true);
  await comparison.focus();
  await expect(comparison).toBeFocused();
  const side1 = comparison.getByTestId("match-score-side-1");
  const side2 = comparison.getByTestId("match-score-side-2");
  await expect(side1.getByLabel("隊伍 1", { exact: true })).toHaveValue(
    new RegExp(fixture.setNameMine),
  );
  await expect(side1).toContainText("勝方");
  await expect(side1).toContainText("對抗點數：3");
  await expect(side1).toContainText("加射：10");
  await expect(side2.getByLabel("隊伍 2", { exact: true })).toHaveValue(
    new RegExp(fixture.setNameOpponent),
  );
  await expect(side2).toContainText("對抗點數：1");
  await expect(side2).toContainText("加射：9");
  await expect(comparison.getByLabel("對抗")).toBeVisible();
  await expect(comparison.getByLabel("第 1 波")).toBeVisible();
  await expect(comparison.getByLabel("第 2 波")).toBeVisible();
  await expect(comparison.getByLabel("第 3 波")).toBeVisible();

  const firstEndSide1 = comparison.getByTestId("match-score-end-1-side-1");
  const secondEndSide1ForLayout = comparison.getByTestId(
    "match-score-end-2-side-1",
  );
  const [firstEndCellBox, firstEndContentBox, secondEndCellBox] =
    await Promise.all([
      firstEndSide1.boundingBox(),
      firstEndSide1.getByLabel("已確認波次比分").boundingBox(),
      secondEndSide1ForLayout.boundingBox(),
    ]);
  if (!firstEndCellBox || !firstEndContentBox || !secondEndCellBox) {
    throw new Error("波次比分卡片未取得位置");
  }
  expect(
    Math.abs(firstEndCellBox.width - firstEndContentBox.width),
  ).toBeLessThanOrEqual(1);
  expect(firstEndContentBox.height).toBeLessThanOrEqual(110);
  expect(secondEndCellBox.y).toBeGreaterThanOrEqual(
    firstEndCellBox.y + firstEndCellBox.height,
  );
  await expect(firstEndSide1).toContainText("X");
  await expect(firstEndSide1).toContainText("M");
  await expect(firstEndSide1).toContainText("已確認");
  await expect(firstEndSide1.getByLabel("箭分總分：10")).toBeVisible();
  await expect(firstEndSide1.getByLabel("本波點數：2（預估）")).toBeVisible();
  await expect(firstEndSide1.getByLabel("預估點數")).toBeVisible();
  await expect(firstEndSide1.getByLabel("累積點數：2")).toBeVisible();
  await expect(firstEndSide1.getByLabel("已確認波次比分")).toHaveAttribute(
    "data-status",
    "confirmed",
  );
  await expect(firstEndSide1.getByLabel("已確認波次比分")).toHaveCSS(
    "background-color",
    "rgba(46, 125, 50, 0.12)",
  );
  const secondEndSide1 = comparison.getByTestId("match-score-end-2-side-1");
  await expect(secondEndSide1).toContainText("10");
  await expect(secondEndSide1).toContainText("9");
  await expect(secondEndSide1).toContainText("8");
  await expect(secondEndSide1).toContainText("未確認");
  await expect(secondEndSide1.getByLabel("本波點數：1（預估）")).toBeVisible();
  await expect(secondEndSide1.getByLabel("累積點數：3")).toBeVisible();
  await expect(secondEndSide1.getByLabel("未確認波次比分")).toHaveAttribute(
    "data-status",
    "unconfirmed",
  );
  await expect(secondEndSide1.getByLabel("未確認波次比分")).toHaveCSS(
    "background-color",
    "rgba(211, 47, 47, 0.12)",
  );
  const firstEndSide2 = comparison.getByTestId("match-score-end-1-side-2");
  await expect(firstEndSide2).toContainText("9");
  await expect(firstEndSide2).toContainText("M");
  await expect(firstEndSide2).toContainText("未確認");
  await expect(firstEndSide2.getByLabel("箭分總分：9")).toBeVisible();
  await expect(firstEndSide2.getByLabel("本波點數：0（預估）")).toBeVisible();
  const secondEndSide2 = comparison.getByTestId("match-score-end-2-side-2");
  await expect(secondEndSide2.getByLabel("本波點數：1（預估）")).toBeVisible();
  await expect(secondEndSide2.getByLabel("累積點數：1")).toBeVisible();
  await expect(comparison.getByTestId("match-score-end-3-side-2")).toHaveText(
    "—",
  );
});

test("進度頁：可切換確認並編輯已確認波次，主 dialog 保持開啟", async ({
  page,
}) => {
  const fixture = buildEliminationFixture("individual");
  const [firstResult, secondResult] =
    fixture.elimination.stages?.[0]?.matchs?.[0]?.match_results ?? [];
  const firstEnd = firstResult?.match_ends?.[0];
  const secondEnd = secondResult?.match_ends?.[0];
  if (!firstEnd?.match_scores || !secondEnd?.match_scores) {
    throw new Error("fixture 缺少第一波雙方箭分");
  }
  firstEnd.is_confirmed = true;
  firstEnd.match_scores.forEach((score, index) => {
    score.score = [10, 0, 9][index] ?? -1;
  });
  firstEnd.total_scores = 19;
  secondEnd.match_scores.forEach((score, index) => {
    score.score = [9, 0, 0][index] ?? -1;
  });
  secondEnd.total_scores = 9;
  const handles = await registerEliminationRoutes(page, fixture);
  handles.setScoreSaveWinner(fixture.opponentMatchResultId);
  const matchSettingsRequests: unknown[] = [];
  await page.route("**/elimination/match/settings/*", async (route) => {
    matchSettingsRequests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );
  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  const firstEndCell = dialog.getByTestId("match-score-end-1-side-1");

  await firstEndCell.getByRole("button", { name: "切換為未確認" }).click();
  await expect
    .poll(() => handles.confirmRequests.map((request) => request.body))
    .toEqual([{ is_confirmed: false }]);
  await expect(
    firstEndCell.getByRole("button", { name: "切換為已確認" }),
  ).toBeVisible();
  await firstEndCell.getByRole("button", { name: "切換為已確認" }).click();
  await expect
    .poll(() => handles.confirmRequests.map((request) => request.body))
    .toEqual([{ is_confirmed: false }, { is_confirmed: true }]);

  await firstEndCell.getByRole("button", { name: "編輯本波分數" }).click();
  const scoreDialog = page.getByRole("dialog", { name: "編輯本波分數" });
  await scoreDialog.locator(".controll_button_group button").last().click();
  await scoreDialog.getByRole("button", { name: "X", exact: true }).click();
  await scoreDialog.getByRole("button", { name: "送出" }).click();
  await expect
    .poll(() => handles.savedScoreRequests.map((request) => request.body))
    .toEqual([
      {
        match_score_ids: fixture.myMatchScoreIds,
        scores: [10, 0, 11],
        total_scores: 20,
      },
    ]);
  await expect(dialog).toBeVisible();
  await expect(firstEndCell.getByLabel("已確認波次比分")).toHaveAttribute(
    "data-status",
    "confirmed",
  );
  await expect(firstEndCell.getByLabel("箭分總分：20")).toBeVisible();
  await expect(firstEndCell.getByLabel("本波點數：2")).toBeVisible();
  await expect(firstEndCell.getByLabel("累積點數：2")).toBeVisible();
  await expect(dialog.getByTestId("match-score-side-1")).toContainText(
    "對抗點數：2",
  );
  await expect(dialog.getByLabel("贏家")).toContainText(
    `隊伍 2：${fixture.setNameOpponent}`,
  );
  await dialog.getByRole("button", { name: "儲存" }).click();
  await expect
    .poll(() => matchSettingsRequests)
    .toEqual([
      {
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
    ]);
  await expect
    .poll(() => handles.getMatchEndState(fixture.myMatchEndId)?.is_confirmed)
    .toBe(true);
});

test("進度頁：確認切換失敗會保留原狀並顯示錯誤", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  const handles = await registerEliminationRoutes(page, fixture);
  handles.setConfirmShouldFail(true);

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );
  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "修改對抗組" });
  const firstEndCell = dialog.getByTestId("match-score-end-1-side-1");

  await firstEndCell.getByRole("button", { name: "切換為已確認" }).click();
  await expect.poll(() => handles.confirmRequests).toHaveLength(1);
  await expect(
    dialog.getByText("更新本波確認狀態失敗，請稍後再試。"),
  ).toBeVisible();
  await expect(firstEndCell.getByLabel("未確認波次比分")).toHaveAttribute(
    "data-status",
    "unconfirmed",
  );
});

test("進度頁：改分失敗會保留編輯內容且不污染伺服器狀態", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  const originalEnd =
    fixture.elimination.stages?.[0]?.matchs?.[0]?.match_results?.[0]
      ?.match_ends?.[0];
  if (!originalEnd?.match_scores) {
    throw new Error("fixture 缺少第一波箭分");
  }
  const originalScores = originalEnd.match_scores.map((score) => score.score);
  const originalTotal = originalEnd.total_scores;
  const handles = await registerEliminationRoutes(page, fixture);
  handles.setScoresShouldFail(true);

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/progress/elimination/1`,
  );
  await page.getByText(fixture.setNameMine, { exact: true }).click();
  const matchDialog = page.getByRole("dialog", { name: "修改對抗組" });
  await matchDialog
    .getByTestId("match-score-end-1-side-1")
    .getByRole("button", { name: "編輯本波分數" })
    .click();

  const scoreDialog = page.getByRole("dialog", { name: "編輯本波分數" });
  await scoreDialog.getByRole("button", { name: "X", exact: true }).click();
  await scoreDialog.getByRole("button", { name: "送出" }).click();

  await expect.poll(() => handles.savedScoreRequests).toHaveLength(1);
  await expect(scoreDialog).toBeVisible();
  await expect(
    scoreDialog.getByText("儲存本波分數失敗，請稍後再試。"),
  ).toBeVisible();
  await expect(
    scoreDialog.locator(".score_block").getByText("X", { exact: true }),
  ).toBeVisible();
  await expect
    .poll(() =>
      handles
        .getMatchEndState(fixture.myMatchEndId)
        ?.match_scores?.map((score) => score.score),
    )
    .toEqual(originalScores);
  await expect
    .poll(() => handles.getMatchEndState(fixture.myMatchEndId)?.total_scores)
    .toBe(originalTotal);
});
