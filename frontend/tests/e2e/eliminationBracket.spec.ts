import { expect, test } from "@playwright/test";
import {
  buildEliminationFixture,
  registerEliminationRoutes,
} from "./eliminationFixtures";
import type { DatabasePlayer, DatabasePlayerSet, DatabaseStage } from "@/types/Api";
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

function completeEightEntrantStages(eliminationId: number): DatabaseStage[] {
  let matchId = 9950;
  let resultId = 9960;
  return [4, 2, 2].map((matchCount, stageIndex) => ({
    id: 9940 + stageIndex,
    elimination_id: eliminationId,
    matchs: Array.from({ length: matchCount }, () => ({
      id: matchId++,
      match_results: [{ id: resultId++ }, { id: resultId++ }],
    })),
  }));
}

async function prepareIndividualAutoCreate(page: import("@playwright/test").Page) {
  const fixture = buildEliminationFixture("individual");
  fixture.elimination.player_sets = [];
  fixture.elimination.stages = [];
  fixture.groupsWithPlayers.groups.unshift({
    id: 9299,
    competition_id: fixture.competitionId,
    group_name: "未分組",
    players: [],
  });

  const group = fixture.groupsWithPlayers.groups[1];
  group.players = Array.from({ length: 5 }, (_, index): DatabasePlayer => ({
    id: 9700 + index,
    group_id: group.id,
    name: `資格選手 ${index + 1}`,
    rank: index + 1,
    total_score: 500 - index,
  }));
  await registerEliminationRoutes(page, fixture);

  let playerSets: DatabasePlayerSet[] = [];
  let stages: DatabaseStage[] = [];
  await page.route(`**/elimination/playersets/${fixture.eliminationId}`, async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ player_sets: playerSets }),
    })
  );
  await page.route(`**/elimination/stages/scores/medals/${fixture.eliminationId}`, async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...fixture.elimination, player_sets: playerSets, stages }),
    })
  );
  await page.route(`**/qualification/${group.id}`, async (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: group.id, advancing_num: 4 }),
    })
  );

  return {
    fixture,
    group,
    getPlayerSets: () => playerSets,
    setPlayerSets: (sets: DatabasePlayerSet[]) => {
      playerSets = sets;
    },
    setStages: (nextStages: DatabaseStage[]) => {
      stages = nextStages;
    },
  };
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
  test(`對抗賽設定：${variant} 可建立空白完整樹且隊伍仍可編輯`, async ({ page }) => {
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
    const bracketRequests: unknown[] = [];
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
        bracketRequests.push(route.request().postDataJSON());
        fixture.elimination.bracket_seed_count = 4;
        stages = completeFourEntrantStages(fixture.eliminationId);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            elimination_id: fixture.eliminationId,
            entrant_count: 4,
            advancing_count: 4,
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

    await expect(page.getByText("實際隊數：4")).toBeVisible();
    await expect(page.getByText("對抗樹大小：4")).toBeVisible();
    if (teamSize !== 1) {
      await expect(page.getByRole("button", { name: "依資格排名建立隊伍" })).toHaveCount(0);
    }
    await page.getByRole("button", { name: "建立完整對抗樹" }).click();
    await page.getByRole("dialog", { name: "建立完整對抗樹" }).getByRole("button", { name: "建立" }).click();
    await expect(page.getByText("建立狀態：完整對抗樹已建立")).toBeVisible();
    await expect(page.getByText(/名單狀態：/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "創建隊伍" })).toBeEnabled();
    expect(bracketRequests).toEqual([{ advancing_count: 4 }]);
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
  await page.getByRole("dialog", { name: "建立完整對抗樹" }).getByRole("button", { name: "建立" }).click();
  await expect(
    page.getByText("已有部分或不相容賽程，未覆寫既有資料。")
  ).toBeVisible();
});

test("新增隊伍不會自動更新第一輪籤表", async ({ page }) => {
  const fixture = buildEliminationFixture("individual");
  const playerSets = rankedPlayerSets(fixture.eliminationId);
  fixture.elimination.player_sets = playerSets;
  fixture.elimination.bracket_seed_count = 4;
  fixture.elimination.stages = completeFourEntrantStages(fixture.eliminationId);
  fixture.groupsWithPlayers.groups.unshift({
    id: 9299,
    competition_id: fixture.competitionId,
    group_name: "未分組",
    players: [],
  });
  await registerEliminationRoutes(page, fixture);

  let bracketDetailRequests = 0;
  await page.route(
    `**/elimination/stages/scores/medals/${fixture.eliminationId}`,
    async (route) => {
      bracketDetailRequests++;
      const stages = JSON.parse(JSON.stringify(fixture.elimination.stages)) as DatabaseStage[];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...fixture.elimination, stages }),
      });
    }
  );
  await page.route("**/playerset", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: 9900,
        elimination_id: fixture.eliminationId,
        set_name: "新增隊伍",
      }),
    });
  });

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.goto(
    `${baseUrl}/competition/${fixture.competitionId}/admin/schedule/elimination/1`
  );
  await expect.poll(() => bracketDetailRequests).toBeGreaterThanOrEqual(1);

  await page.getByLabel("選手姓名").fill("我方選手");
  await page.getByRole("option", { name: "我方選手 rank: undefined" }).click();
  await page.getByRole("button", { name: "創建隊伍" }).click();

  // 排名或隊伍異動只更新隊伍資料；首輪格位只能由進度頁的明確按鈕更新。
  await expect.poll(() => bracketDetailRequests).toBe(1);
});

test("單人對抗賽：自動建組預填 advancing_num，可覆寫並刷新隊伍", async ({ page }) => {
  const setup = await prepareIndividualAutoCreate(page);
  const autoCreateRequests: unknown[] = [];
  const bracketRequests: unknown[] = [];
  await page.route(`**/playerset/elimination/${setup.fixture.eliminationId}/auto`, async (route) => {
    const body = route.request().postDataJSON() as { count: number };
    autoCreateRequests.push(body);
    setup.setPlayerSets(
      setup.group.players.slice(0, body.count).map((player, index) => ({
        id: 9800 + index,
        elimination_id: setup.fixture.eliminationId,
        rank: player.rank,
        set_name: player.name,
        total_score: player.total_score,
        players: [player],
      }))
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        elimination_id: setup.fixture.eliminationId,
        requested_count: body.count,
        created_count: body.count,
        reused_count: 0,
        player_sets: setup.getPlayerSets(),
      }),
    });
  });
  await page.route(
    `**/elimination/bracket/${setup.fixture.eliminationId}`,
    async (route) => {
      bracketRequests.push(route.request().postDataJSON());
      setup.fixture.elimination.bracket_seed_count = 8;
      setup.setStages(completeEightEntrantStages(setup.fixture.eliminationId));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          elimination_id: setup.fixture.eliminationId,
          entrant_count: 5,
          advancing_count: 8,
          bracket_size: 8,
          stage_count: 3,
          created: true,
        }),
      });
    }
  );

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.goto(
    `${baseUrl}/competition/${setup.fixture.competitionId}/admin/schedule/elimination/1`
  );

  const countInput = page.getByLabel("建立人數");
  await expect(countInput).toHaveValue("4");
  await countInput.fill("5");
  await page.getByRole("button", { name: "依資格排名建立隊伍" }).click();
  await expect(page.getByText("將依目前儲存的資格排名建立前 5 名隊伍，確定要繼續嗎？")).toBeVisible();
  await page.getByRole("button", { name: "確認建立" }).click();

  await expect(page.getByText("實際隊數：5")).toBeVisible();
  expect(autoCreateRequests).toEqual([{ count: 5 }]);

  const createBracketButton = page.getByRole("button", {
    name: "建立完整對抗樹",
  });
  await expect(createBracketButton).toBeEnabled();
  await createBracketButton.click();
  const bracketDialog = page.getByRole("dialog", { name: "建立完整對抗樹" });
  await bracketDialog.getByLabel("晉級數").fill("8");
  await bracketDialog.getByRole("button", { name: "建立" }).click();
  await expect(page.getByText("建立狀態：完整對抗樹已建立")).toBeVisible();
  expect(bracketRequests).toEqual([{ advancing_count: 8 }]);
});

test("單人對抗賽：自動建組衝突時保留既有列表並顯示錯誤", async ({ page }) => {
  const setup = await prepareIndividualAutoCreate(page);
  await page.route(`**/playerset/elimination/${setup.fixture.eliminationId}/auto`, async (route) =>
    route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ error: "incompatible player sets" }),
    })
  );

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.goto(
    `${baseUrl}/competition/${setup.fixture.competitionId}/admin/schedule/elimination/1`
  );
  await page.getByRole("button", { name: "依資格排名建立隊伍" }).click();
  await page.getByRole("button", { name: "確認建立" }).click();

  await expect(
    page.getByText("已有對抗階段或既有隊伍與資格排名不相容，未覆寫既有資料。")
  ).toBeVisible();
  await expect(page.getByText("實際隊數：0")).toBeVisible();
});
