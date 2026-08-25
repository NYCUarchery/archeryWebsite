import { expect, test, type Page } from "@playwright/test";

const competitionId = 9801;
const userId = 9802;
const groupAId = 9810;
const groupBId = 9811;

type RankingPlayer = {
  id: number;
  name: string;
  rank: number;
  total_score: number;
  x_count: number;
  ten_count: number;
};

type RankingResponse = {
  group_id: number;
  group_name: string;
  players: RankingPlayer[];
};

type RankingRouteHandles = {
  patchBodies: unknown[];
  setGetDelay: (groupId: number, delayMs: number) => void;
  setGetError: (groupId: number, hasError: boolean) => void;
  setGroupPlayers: (groupId: number, players: RankingPlayer[]) => void;
  setConflictOnNextSave: () => void;
};

const initialRankings: Record<number, RankingResponse> = {
  [groupAId]: {
    group_id: groupAId,
    group_name: "公開男子反曲弓組",
    players: [
      { id: 1, name: "王小明", rank: 1, total_score: 650, x_count: 12, ten_count: 20 },
      { id: 2, name: "李小華", rank: 2, total_score: 650, x_count: 10, ten_count: 23 },
      { id: 3, name: "陳小美", rank: 3, total_score: 644, x_count: 8, ten_count: 19 },
    ],
  },
  [groupBId]: {
    group_id: groupBId,
    group_name: "公開女子反曲弓組",
    players: [
      { id: 4, name: "趙小安", rank: 1, total_score: 638, x_count: 9, ten_count: 16 },
    ],
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function rankingRows(page: Page) {
  return page.locator('[role="dialog"]').filter({ hasText: "手動調整資格賽排名" });
}

function dragHandle(page: Page, name: string) {
  return page.getByRole("button", { name: `拖動 ${name} 排名` });
}

async function orderNames(page: Page) {
  return page
    .locator('[role="dialog"] button[aria-label^="拖動 "]')
    .evaluateAll((handles) =>
      handles.map((handle) => handle.getAttribute("aria-label")?.replace(/^拖動 (.*) 排名$/, "$1"))
    );
}

async function moveFirstPlayerDownWithKeyboard(page: Page) {
  const handle = dragHandle(page, "王小明");
  await handle.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(100);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(100);
  await page.keyboard.press("Space");
  await expect.poll(() => orderNames(page)).toEqual(["李小華", "王小明", "陳小美"]);
}

async function registerQualificationRankingRoutes(page: Page): Promise<RankingRouteHandles> {
  const rankings = clone(initialRankings);
  const patchBodies: unknown[] = [];
  const getDelays = new Map<number, number>();
  const getErrors = new Set<number>();
  let conflictOnNextSave = false;

  const competition = {
    id: competitionId,
    title: "E2E 資格賽排名",
    sub_title: "mock",
    host_id: userId,
    rounds_num: 6,
    unassigned_group_id: 9809,
    groups_num: 2,
    unassigned_lane_id: 9808,
    lanes_num: 0,
    current_phase: 0,
    qualification_current_end: 0,
    qualification_is_active: true,
    elimination_is_active: false,
    team_elimination_is_active: false,
    mixed_elimination_is_active: false,
    script: "",
    groups: [
      {
        id: 9809,
        competition_id: competitionId,
        group_name: "未分組",
        group_range: "",
        bow_type: "",
        group_index: 0,
        players: [],
      },
      {
        id: groupAId,
        competition_id: competitionId,
        group_name: rankings[groupAId].group_name,
        group_range: "公開男子",
        bow_type: "反曲弓",
        group_index: 1,
        players: [],
      },
      {
        id: groupBId,
        competition_id: competitionId,
        group_name: rankings[groupBId].group_name,
        group_range: "公開女子",
        bow_type: "反曲弓",
        group_index: 2,
        players: [],
      },
    ],
  };

  await page.route("**/user/me", async (route) => {
    await route.fulfill({ json: { id: userId } });
  });
  await page.route(`**/user/${userId}`, async (route) => {
    await route.fulfill({ json: { id: userId, username: "ranking-admin", real_name: "排名管理員" } });
  });
  await page.route(`**/participant/competition/user/${competitionId}/${userId}`, async (route) => {
    await route.fulfill({ json: [] });
  });
  await page.route(`**/competition/groups/${competitionId}`, async (route) => {
    await route.fulfill({ json: competition });
  });
  await page.route(`**/competition/groups/players/${competitionId}`, async (route) => {
    await route.fulfill({ json: { groups: competition.groups } });
  });
  // 進度頁的 lane panel 也會渲染；空 lane 令測試只聚焦排名對話框。
  await page.route(`**/lane/all/${competitionId}`, async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route("**/groupinfo/players/ranking/*", async (route) => {
    const groupId = Number(route.request().url().split("/").pop());
    const ranking = rankings[groupId];
    if (!ranking) {
      await route.fulfill({ status: 404, json: { message: "not found" } });
      return;
    }
    if (route.request().method() === "GET") {
      const delayMs = getDelays.get(groupId) ?? 0;
      if (delayMs > 0) {
        getDelays.delete(groupId);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      if (getErrors.has(groupId)) {
        await route.fulfill({ status: 500, json: { error: "ranking unavailable" } });
        return;
      }
      await route.fulfill({ json: clone(ranking) });
      return;
    }

    const body = route.request().postDataJSON() as {
      expected_player_ids: number[];
      player_ids: number[];
    };
    patchBodies.push(body);
    if (conflictOnNextSave) {
      conflictOnNextSave = false;
      await route.fulfill({ status: 409, json: { message: "ranking changed" } });
      return;
    }

    const playerById = new Map(ranking.players.map((player) => [player.id, player]));
    ranking.players = body.player_ids.map((id, index) => ({
      ...playerById.get(id)!,
      rank: index + 1,
    }));
    await route.fulfill({ json: clone(ranking) });
  });
  await page.route(`**/competition/refresh/groups/players/rank/${competitionId}`, async (route) => {
    for (const [groupId, ranking] of Object.entries(initialRankings)) {
      rankings[Number(groupId)] = clone(ranking);
    }
    await route.fulfill({ json: { message: "Update Competition Ranking Success" } });
  });

  return {
    patchBodies,
    setGetDelay: (groupId, delayMs) => getDelays.set(groupId, delayMs),
    setGetError: (groupId, hasError) => {
      if (hasError) getErrors.add(groupId);
      else getErrors.delete(groupId);
    },
    setGroupPlayers: (groupId, players) => {
      rankings[groupId].players = clone(players);
    },
    setConflictOnNextSave: () => {
      conflictOnNextSave = true;
    },
  };
}

async function gotoQualificationProgress(page: Page) {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1";
  await page.goto(`${baseUrl}/competition/${competitionId}/admin/progress/qualification`);
  await page.getByRole("button", { name: "手動調整排名" }).click();
  await expect(page.getByRole("heading", { name: "手動調整資格賽排名" })).toBeVisible();
}

test.describe("Qualification ranking dialog", () => {
  test("開啟時顯示完整排名統計與非過小的對話框", async ({ page }) => {
    await registerQualificationRankingRoutes(page);
    await gotoQualificationProgress(page);

    const dialog = rankingRows(page);
    await expect(dialog.getByText("總分", { exact: true })).toBeVisible();
    await expect(dialog.getByText("X", { exact: true })).toBeVisible();
    await expect(dialog.getByText("10", { exact: true })).toBeVisible();
    await expect(dialog.getByText("王小明")).toBeVisible();
    await expect(dialog.getByText("650", { exact: true }).first()).toBeVisible();
    await expect(dialog.getByText("12", { exact: true })).toBeVisible();
    await expect(dialog.getByText("20", { exact: true })).toBeVisible();
    await expect(dialog).toHaveCSS("max-width", /(?:[5-9]\d{2}|\d{4,})px/);
  });

  test("排名載入中顯示 loading", async ({ page }) => {
    const routes = await registerQualificationRankingRoutes(page);
    routes.setGetDelay(groupAId, 500);
    await gotoQualificationProgress(page);

    const dialog = rankingRows(page);
    await expect(dialog.getByRole("progressbar")).toBeVisible();
    await expect(dialog.getByText("王小明")).toBeVisible();
  });

  test("空組顯示提示", async ({ page }) => {
    const routes = await registerQualificationRankingRoutes(page);
    routes.setGroupPlayers(groupBId, []);
    await gotoQualificationProgress(page);

    await page.getByRole("combobox", { name: "正式組別" }).click();
    await page.getByRole("option", { name: "公開女子反曲弓組" }).click();
    await expect(page.getByText("此組別尚無選手。")).toBeVisible();
  });

  test("排名 API 失敗顯示錯誤", async ({ page }) => {
    const routes = await registerQualificationRankingRoutes(page);
    routes.setGetError(groupAId, true);
    await gotoQualificationProgress(page);

    await expect(page.getByText("排名載入失敗，請稍後重試。")).toBeVisible();
  });

  test("鍵盤拖排後送出正確 payload，重開仍顯示儲存後順序", async ({ page }) => {
    const routes = await registerQualificationRankingRoutes(page);
    await gotoQualificationProgress(page);

    await moveFirstPlayerDownWithKeyboard(page);
    await page.getByRole("button", { name: "儲存排名" }).click();
    await expect(page.getByText("手動排名已儲存")).toBeVisible();
    await expect.poll(() => routes.patchBodies).toEqual([
      { expected_player_ids: [1, 2, 3], player_ids: [2, 1, 3] },
    ]);

    await page.getByRole("button", { name: "手動調整排名" }).click();
    await expect.poll(() => orderNames(page)).toEqual(["李小華", "王小明", "陳小美"]);
  });

  test("自動更新排名會覆寫已儲存的手動順序", async ({ page }) => {
    await registerQualificationRankingRoutes(page);
    await gotoQualificationProgress(page);

    await moveFirstPlayerDownWithKeyboard(page);
    await page.getByRole("button", { name: "儲存排名" }).click();
    await expect(page.getByText("手動排名已儲存")).toBeVisible();
    await page.getByRole("button", { name: "自動更新排名" }).click();
    await expect(page.getByText("自動更新排名成功")).toBeVisible();

    await page.getByRole("button", { name: "手動調整排名" }).click();
    await expect.poll(() => orderNames(page)).toEqual(["王小明", "李小華", "陳小美"]);
  });

  test("有未儲存拖排時取消只要求捨棄，不送出 PATCH", async ({ page }) => {
    const routes = await registerQualificationRankingRoutes(page);
    await gotoQualificationProgress(page);

    await moveFirstPlayerDownWithKeyboard(page);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect.poll(() => orderNames(page)).toEqual(["李小華", "王小明", "陳小美"]);
    await page.getByRole("button", { name: "取消", exact: true }).click();
    await expect(page.getByRole("heading", { name: "捨棄未儲存的調整？" })).toBeVisible();
    expect(routes.patchBodies).toEqual([]);
    await page.getByRole("button", { name: "捨棄變更" }).click();
    await expect(page.getByRole("heading", { name: "手動調整資格賽排名" })).not.toBeVisible();
    expect(routes.patchBodies).toEqual([]);
  });

  test("可切換正式組別並以滑鼠拖排", async ({ page }) => {
    await registerQualificationRankingRoutes(page);
    await gotoQualificationProgress(page);

    await page.getByRole("combobox", { name: "正式組別" }).click();
    await page.getByRole("option", { name: "公開女子反曲弓組" }).click();
    await expect(page.getByText("趙小安")).toBeVisible();

    await page.getByRole("combobox", { name: "正式組別" }).click();
    await page.getByRole("option", { name: "公開男子反曲弓組" }).click();
    await expect(page.getByText("王小明")).toBeVisible();

    const sourceHandle = dragHandle(page, "王小明");
    const source = await sourceHandle.boundingBox();
    const target = await dragHandle(page, "陳小美").boundingBox();
    expect(source).not.toBeNull();
    expect(target).not.toBeNull();
    await sourceHandle.hover();
    await page.mouse.down();
    await page.mouse.move(source!.x + source!.width / 2, source!.y + source!.height / 2 + 10, { steps: 5 });
    await page.waitForTimeout(100);
    await page.mouse.move(target!.x + target!.width / 2, target!.y + target!.height - 2, { steps: 20 });
    await page.waitForTimeout(100);
    await page.mouse.up();
    await expect.poll(() => orderNames(page)).toEqual(["李小華", "陳小美", "王小明"]);
  });

  test("儲存遇 409 時保留草稿並提供重新載入", async ({ page }) => {
    const routes = await registerQualificationRankingRoutes(page);
    await gotoQualificationProgress(page);

    await moveFirstPlayerDownWithKeyboard(page);
    routes.setConflictOnNextSave();
    await page.getByRole("button", { name: "儲存排名" }).click();
    await expect(page.getByText("名單或排名已變更，請重新載入後再調整")).toBeVisible();
    await expect(page.getByRole("button", { name: "重新載入" })).toBeVisible();
    await expect.poll(() => orderNames(page)).toEqual(["李小華", "王小明", "陳小美"]);

    await page.getByRole("button", { name: "重新載入" }).click();
    await expect.poll(() => orderNames(page)).toEqual(["王小明", "李小華", "陳小美"]);
  });
});
