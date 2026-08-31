import { expect, test } from "@playwright/test";
import type { DatabaseGroup } from "@/types/Api";
import {
  buildEliminationFixture,
  registerEliminationRoutes,
} from "./eliminationFixtures";

test("個人賽：0 隊亦可開建樹 dialog，128 晉級數只顯示必要摘要", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  fixture.elimination.player_sets = [];
  const unassigned: DatabaseGroup = {
    id: 9299,
    competition_id: fixture.competitionId,
    group_name: "未分組",
  };
  fixture.competition.groups = [unassigned, ...(fixture.competition.groups ?? [])];
  fixture.groupsWithPlayers.groups = [
    { ...unassigned, players: [] },
    ...fixture.groupsWithPlayers.groups,
  ];
  await registerEliminationRoutes(page, fixture);
  await page.route(`**/qualification/${fixture.eliminationId - 100}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: fixture.eliminationId - 100, advancing_num: 8 }),
    });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/schedule/elimination/1`
  );

  await page.getByRole("button", { name: "建立完整對抗樹" }).click();
  const dialog = page.getByRole("dialog", { name: "建立完整對抗樹" });
  await expect(dialog.getByText("實際隊數：0")).toBeVisible();
  await dialog.getByLabel("晉級數").fill("128");
  await expect(dialog.getByText(/空 seed：/)).toHaveCount(0);
  await expect(dialog.getByText(/補齊 bracket 的 padding：/)).toHaveCount(0);
  await expect(dialog.getByText("對抗樹大小：128")).toBeVisible();
});

test("建樹成功：送出固定晉級數並刷新排名、隊伍與首輪籤表", async ({
  page,
}) => {
  const fixture = buildEliminationFixture("individual");
  fixture.elimination.stages = [];
  fixture.elimination.player_sets?.forEach((playerSet) => {
    playerSet.rank = 0;
  });
  fixture.elimination.player_sets?.push(
    ...[0, 1, 2].map((offset) => ({
      id: 9700 + offset,
      elimination_id: fixture.eliminationId,
      set_name: `後備候選 ${offset + 1}`,
      rank: 0,
      players: [],
    }))
  );
  await registerEliminationRoutes(page, fixture);

  let bracketCreated = false;
  let rankingRequests = 0;
  let playerSetRequests = 0;
  let detailRequests = 0;
  const createRequests: unknown[] = [];
  const seededElimination = JSON.parse(
    JSON.stringify(fixture.elimination)
  ) as typeof fixture.elimination;
  seededElimination.bracket_seed_count = 4;
  seededElimination.bracket_roster_locked = false;
  seededElimination.player_sets?.forEach((playerSet, index) => {
    playerSet.rank = index + 1;
  });

  await page.route(
    `**/elimination/stages/scores/medals/${fixture.eliminationId}`,
    async (route) => {
      detailRequests++;
      await route.fulfill({
        json: bracketCreated ? seededElimination : fixture.elimination,
      });
    }
  );
  await page.route(
    `**/elimination/playersets/${fixture.eliminationId}`,
    async (route) => {
      playerSetRequests++;
      await route.fulfill({
        json: bracketCreated ? seededElimination : fixture.elimination,
      });
    }
  );
  await page.route(
    `**/playerset/elimination/${fixture.eliminationId}/ranking`,
    async (route) => {
      rankingRequests++;
      await route.fulfill({
        json: {
          elimination_id: fixture.eliminationId,
          player_sets: (bracketCreated
            ? seededElimination.player_sets
            : fixture.elimination.player_sets
          )?.map((playerSet) => ({
            id: playerSet.id,
            rank: playerSet.rank,
            set_name: playerSet.set_name,
          })),
        },
      });
    }
  );
  await page.route(`**/elimination/bracket/${fixture.eliminationId}`, async (route) => {
    createRequests.push(route.request().postDataJSON());
    bracketCreated = true;
    await route.fulfill({
      status: 200,
      json: { elimination_id: fixture.eliminationId, advancing_count: 4 },
    });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/schedule/elimination/1`
  );
  await expect(page.getByRole("button", { name: "建立完整對抗樹" })).toBeEnabled();
  const initialRequestCounts = {
    ranking: rankingRequests,
    playerSets: playerSetRequests,
    detail: detailRequests,
  };

  await page.getByRole("button", { name: "建立完整對抗樹" }).click();
  const dialog = page.getByRole("dialog", { name: "建立完整對抗樹" });
  await dialog.getByLabel("晉級數").fill("4");
  await expect(
    dialog.getByText("前 4 隊依排名排入第一階段，其餘 1 隊保留為後備。")
  ).toBeVisible();
  await expect(dialog.getByRole("button", { name: "建立" })).toBeEnabled();
  await dialog.getByRole("button", { name: "建立" }).click();

  await expect.poll(() => createRequests).toEqual([{ advancing_count: 4 }]);
  await expect.poll(() => rankingRequests).toBeGreaterThan(initialRequestCounts.ranking);
  await expect.poll(() => playerSetRequests).toBeGreaterThan(initialRequestCounts.playerSets);
  await expect.poll(() => detailRequests).toBeGreaterThan(initialRequestCounts.detail);
});
