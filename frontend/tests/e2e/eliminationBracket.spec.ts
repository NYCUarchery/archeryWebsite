import { expect, test } from "@playwright/test";
import {
  buildEliminationFixture,
  registerEliminationRoutes,
} from "./eliminationFixtures";
import type { DatabasePlayerSet, DatabaseStage } from "@/types/Api";
import type { EliminationVariant } from "./eliminationFixtures";

function rankedPlayerSets(eliminationId: number): DatabasePlayerSet[] {
  return Array.from({ length: 4 }, (_, index) => ({
    id: 9800 + index,
    elimination_id: eliminationId,
    rank: index + 1,
    set_name: `第 ${index + 1} 種子`,
    total_score: 100 - index,
    players: [],
  }));
}

function completeFourEntrantStages(eliminationId: number): DatabaseStage[] {
  return [
    {
      id: 9901,
      elimination_id: eliminationId,
      matchs: [
        { id: 9911, match_results: [{ id: 9931 }, { id: 9932 }] },
        { id: 9912, match_results: [{ id: 9933 }, { id: 9934 }] },
      ],
    },
    {
      id: 9902,
      elimination_id: eliminationId,
      matchs: [
        { id: 9921, match_results: [{ id: 9941 }, { id: 9942 }] },
        { id: 9922, match_results: [{ id: 9943 }, { id: 9944 }] },
      ],
    },
  ];
}

test("對抗賽計分板：尚無階段時顯示建立提示，不渲染崩潰", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  fixture.elimination.stages = [];
  await registerEliminationRoutes(page, fixture);

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/scoreboard/0/elimination/1`
  );

  await expect(page.getByText("尚未建立完整對抗樹。")).toBeVisible();
});

for (const [variant, teamSize] of [
  ["individual", 1],
  ["mixed", 2],
  ["team", 3],
] as Array<[EliminationVariant, number]>) {
  test(`對抗賽設定：${variant} 可建立完整樹並刷新鎖定狀態`, async ({ page }) => {
    const fixture = buildEliminationFixture(variant);
    const playerSets = rankedPlayerSets(fixture.eliminationId);
    fixture.elimination.player_sets = playerSets;
    fixture.elimination.stages = [];
    fixture.groupsWithPlayers.groups.unshift({
      id: 9299,
      competition_id: fixture.competitionId,
      group_name: "未分組",
      players: [],
    });
    await registerEliminationRoutes(page, fixture);

    let stages: DatabaseStage[] = [];
    let bracketRequests = 0;
    await page.route(
      `**/elimination/playersets/${fixture.eliminationId}`,
      async (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ player_sets: playerSets }),
        })
    );
    await page.route(
      `**/elimination/stages/scores/medals/${fixture.eliminationId}`,
      async (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...fixture.elimination, stages }),
        })
    );
    await page.route(
      `**/elimination/bracket/${fixture.eliminationId}`,
      async (route) => {
        bracketRequests++;
        stages = completeFourEntrantStages(fixture.eliminationId);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            elimination_id: fixture.eliminationId,
            entrant_count: 4,
            bracket_size: 4,
            stage_count: 2,
            created: true,
          }),
        });
      }
    );

    const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
    await page.goto(
      `${baseUrl}/competition/${fixture.competitionId}/admin/schedule/elimination/${teamSize}`
    );

    await expect(page.getByText("隊數：4")).toBeVisible();
    await expect(page.getByText("下一個 2 的冪：4")).toBeVisible();
    await page.getByRole("button", { name: "建立完整對抗樹" }).click();
    await expect(page.getByText("建立狀態：完整對抗樹已建立")).toBeVisible();
    await expect(page.getByRole("button", { name: "創建隊伍" })).toBeDisabled();
    expect(bracketRequests).toBe(1);
  });
}

test("對抗賽設定：409 顯示不覆寫既有資料", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  const playerSets = rankedPlayerSets(fixture.eliminationId);
  fixture.elimination.player_sets = playerSets;
  fixture.elimination.stages = [];
  fixture.groupsWithPlayers.groups.unshift({
    id: 9299,
    competition_id: fixture.competitionId,
    group_name: "未分組",
    players: [],
  });
  await registerEliminationRoutes(page, fixture);
  await page.route(`**/elimination/playersets/${fixture.eliminationId}`, async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ player_sets: playerSets }),
    })
  );
  await page.route(`**/elimination/bracket/${fixture.eliminationId}`, async (route) =>
    route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ error: "elimination bracket is partial or incompatible" }),
    })
  );

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/schedule/elimination/1`
  );
  await page.getByRole("button", { name: "建立完整對抗樹" }).click();
  await expect(
    page.getByText("已有部分或不相容賽程，未覆寫既有資料。")
  ).toBeVisible();
});
