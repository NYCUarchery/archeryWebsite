import { expect, test, type Page } from "@playwright/test";
import {
  buildEliminationFixture,
  registerEliminationRoutes,
} from "./eliminationFixtures";
import type { DatabasePlayerSet, DatabaseStage } from "@/types/Api";

// 對抗賽隊伍排名（PlayerSet ranking）e2e：右側表格之統計欄位、拖曳排序（滑鼠／鍵盤）、
// 儲存／還原／自動更新排名，以及既有的成員明細／刪除確認對話框仍須正常運作。
// 與資格賽排名（qualificationRankingDialog.spec.ts）不同：此頁面「沒有」排名專用對話框，
// 排名表格直接內嵌於 @sets_panel，故多數斷言改為直接檢查頁面內容，而非某個 dialog 內的內容。

type RankingRow = {
  id: number;
  set_name: string;
  rank: number;
  total_score: number;
  x_count: number;
  ten_count: number;
};

const INITIAL_ROWS: RankingRow[] = [
  { id: 1001, set_name: "藍鷹隊", rank: 1, total_score: 650, x_count: 12, ten_count: 20 },
  { id: 1002, set_name: "紅鶴隊", rank: 2, total_score: 640, x_count: 10, ten_count: 18 },
  { id: 1003, set_name: "黑豹隊", rank: 3, total_score: 630, x_count: 8, ten_count: 15 },
  { id: 1004, set_name: "白狼隊", rank: 4, total_score: 620, x_count: 6, ten_count: 10 },
];

// 自動更新排名回傳之全新順序（刻意與 INITIAL_ROWS 及任何手動草稿都不同，用以證明覆寫確實發生）。
const AUTO_ROWS: RankingRow[] = [
  { id: 1003, set_name: "黑豹隊", rank: 1, total_score: 630, x_count: 8, ten_count: 15 },
  { id: 1001, set_name: "藍鷹隊", rank: 2, total_score: 650, x_count: 12, ten_count: 20 },
  { id: 1002, set_name: "紅鶴隊", rank: 3, total_score: 640, x_count: 10, ten_count: 18 },
  { id: 1004, set_name: "白狼隊", rank: 4, total_score: 620, x_count: 6, ten_count: 10 },
];

// 「重新載入」情境用：模擬另一位管理員已變更順序，藉此驗證 409 後重新整理會拿到伺服器最新順序，
// 而非仍是我方稍早載入時的順序。
const RELOADED_ROWS: RankingRow[] = [
  { id: 1004, set_name: "白狼隊", rank: 1, total_score: 660, x_count: 14, ten_count: 22 },
  { id: 1001, set_name: "藍鷹隊", rank: 2, total_score: 650, x_count: 12, ten_count: 20 },
  { id: 1002, set_name: "紅鶴隊", rank: 3, total_score: 640, x_count: 10, ten_count: 18 },
  { id: 1003, set_name: "黑豹隊", rank: 4, total_score: 630, x_count: 8, ten_count: 15 },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toRankingResponse(eliminationId: number, rows: RankingRow[]) {
  return {
    elimination_id: eliminationId,
    player_sets: rows.map((row) => ({
      id: row.id,
      rank: row.rank,
      set_name: row.set_name,
      total_score: row.total_score,
      x_count: row.x_count,
      ten_count: row.ten_count,
    })),
  };
}

function toPlayerSets(eliminationId: number, rows: RankingRow[]): DatabasePlayerSet[] {
  return rows.map((row) => ({
    id: row.id,
    elimination_id: eliminationId,
    set_name: row.set_name,
    rank: row.rank,
    total_score: row.total_score,
    players: [
      { id: row.id * 10, group_id: 9300, name: `${row.set_name}選手`, rank: 1, total_score: row.total_score },
    ],
  }));
}

// 完整對抗樹（4 隊：一場準決賽階段 + 一場決賽階段，決賽階段固定為金牌／銅牌兩場）。
// 對應 isCompleteEliminationBracket 之判定條件。
function completeBracketStages(eliminationId: number): DatabaseStage[] {
  let matchId = 9700;
  let resultId = 9800;
  return [2, 2].map((matchCount, stageIndex) => ({
    id: 9600 + stageIndex,
    elimination_id: eliminationId,
    matchs: Array.from({ length: matchCount }, () => ({
      id: matchId++,
      match_results: [{ id: resultId++ }, { id: resultId++ }],
    })),
  }));
}

type RankingRouteHandles = {
  patchBodies: Array<{ expected_player_set_ids: number[]; player_set_ids: number[] }>;
  deleteCalls: number[];
  getAutoCalls: () => number;
  setConflictOnNextSave: () => void;
  setSaveErrorOnNextSave: (status: number) => void;
  setAutoErrorOnNextCall: (status: number) => void;
  setServerRows: (rows: RankingRow[]) => void;
};

async function registerRankingRoutes(
  page: Page,
  eliminationId: number,
  initialRows: RankingRow[]
): Promise<RankingRouteHandles> {
  let serverRows = clone(initialRows);
  const patchBodies: RankingRouteHandles["patchBodies"] = [];
  const deleteCalls: number[] = [];
  let conflictOnNextSave = false;
  let saveErrorStatus: number | null = null;
  let autoErrorStatus: number | null = null;
  let autoCalls = 0;

  await page.route(`**/playerset/elimination/${eliminationId}/ranking`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: toRankingResponse(eliminationId, serverRows) });
      return;
    }

    const body = route.request().postDataJSON() as {
      expected_player_set_ids: number[];
      player_set_ids: number[];
    };
    patchBodies.push(body);

    if (conflictOnNextSave) {
      conflictOnNextSave = false;
      await route.fulfill({ status: 409, json: { error: "ranking changed" } });
      return;
    }
    if (saveErrorStatus !== null) {
      const status = saveErrorStatus;
      saveErrorStatus = null;
      await route.fulfill({ status, json: { error: "save failed" } });
      return;
    }

    const byId = new Map(serverRows.map((row) => [row.id, row]));
    serverRows = body.player_set_ids.map((id, index) => ({
      ...byId.get(id)!,
      rank: index + 1,
    }));
    await route.fulfill({ json: toRankingResponse(eliminationId, serverRows) });
  });

  await page.route(`**/playerset/elimination/${eliminationId}/ranking/auto`, async (route) => {
    autoCalls++;
    if (autoErrorStatus !== null) {
      const status = autoErrorStatus;
      autoErrorStatus = null;
      await route.fulfill({ status, json: { error: "auto failed" } });
      return;
    }
    serverRows = clone(AUTO_ROWS);
    await route.fulfill({ json: toRankingResponse(eliminationId, serverRows) });
  });

  await page.route(`**/elimination/playersets/${eliminationId}`, async (route) => {
    await route.fulfill({
      json: { player_sets: toPlayerSets(eliminationId, serverRows) },
    });
  });

  for (const row of initialRows) {
    await page.route(`**/playerset/${row.id}`, async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalls.push(row.id);
        await route.fulfill({ json: { message: "deleted" } });
        return;
      }
      await route.fulfill({
        json: {
          id: row.id,
          elimination_id: eliminationId,
          set_name: row.set_name,
          total_score: row.total_score,
          players: [
            { id: row.id * 10, group_id: 9300, name: `${row.set_name}選手`, rank: 1, total_score: row.total_score },
          ],
        },
      });
    });
  }

  return {
    patchBodies,
    deleteCalls,
    getAutoCalls: () => autoCalls,
    setConflictOnNextSave: () => {
      conflictOnNextSave = true;
    },
    setSaveErrorOnNextSave: (status: number) => {
      saveErrorStatus = status;
    },
    setAutoErrorOnNextCall: (status: number) => {
      autoErrorStatus = status;
    },
    setServerRows: (rows: RankingRow[]) => {
      serverRows = clone(rows);
    },
  };
}

async function setupElimination(
  page: Page,
  options?: { stagesFactory?: (eliminationId: number) => DatabaseStage[] }
) {
  const fixture = buildEliminationFixture("team");
  fixture.elimination.stages = options?.stagesFactory?.(fixture.eliminationId) ?? [];
  // 與 eliminationBracket.spec.ts 同作法：於群組選單前插入「未分組」，讓預設 groupIndex(=1)
  // 對應到真正測試用組別，避免 GroupMenu 顯示 undefined 標籤。
  fixture.groupsWithPlayers.groups.unshift({
    id: 9299,
    competition_id: fixture.competitionId,
    group_name: "未分組",
    players: [],
  });
  await registerEliminationRoutes(page, fixture);
  const routes = await registerRankingRoutes(page, fixture.eliminationId, INITIAL_ROWS);
  return { fixture, routes };
}

async function gotoEliminationSchedule(page: Page, competitionId: number) {
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  await page.goto(`${baseUrl}/competition/${competitionId}/admin/schedule/elimination/3`);
  await expect(page.getByText("藍鷹隊")).toBeVisible();
}

function rankingTable(page: Page) {
  return page.locator("table").first();
}

function dragHandle(page: Page, name: string) {
  return page.getByRole("button", { name: `拖動 ${name} 排名` });
}

function rowByName(page: Page, name: string) {
  return rankingTable(page).locator("tbody tr").filter({ hasText: name });
}

// 讀出目前排名表格每一列之「排名」欄與「隊名」欄，用以同時驗證排序與顯示之排名數字是否一致。
async function tableRows(page: Page) {
  const rows = rankingTable(page).locator("tbody tr");
  const count = await rows.count();
  const result: Array<{ rank: string; name: string }> = [];
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const cells = row.locator("td");
    result.push({
      // td 0 為拖曳把手欄，故排名自 td 1 起算。
      rank: (await cells.nth(1).textContent())?.trim() ?? "",
      name: (await cells.nth(2).textContent())?.trim() ?? "",
    });
  }
  return result;
}

async function moveRowDownWithKeyboard(page: Page, name: string) {
  const handle = dragHandle(page, name);
  await handle.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(100);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(100);
  await page.keyboard.press("Space");
}

test.describe("對抗賽隊伍排名（PlayerSet ranking）", () => {
  test("表格顯示完整統計欄位，且拖曳／儲存皆不開啟排名用對話框；既有明細與刪除對話框仍正常", async ({
    page,
  }) => {
    await setupElimination(page);
    await gotoEliminationSchedule(page, 9100);

    const table = rankingTable(page);
    await expect(table.getByText("排名", { exact: true })).toBeVisible();
    await expect(table.getByText("隊名", { exact: true })).toBeVisible();
    await expect(table.getByText("隊伍總分", { exact: true })).toBeVisible();
    await expect(table.getByText("X", { exact: true })).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "10", exact: true })
    ).toBeVisible();
    await expect.poll(() => tableRows(page)).toEqual([
      { rank: "1", name: "藍鷹隊" },
      { rank: "2", name: "紅鶴隊" },
      { rank: "3", name: "黑豹隊" },
      { rank: "4", name: "白狼隊" },
    ]);
    const firstRowCells = rowByName(page, "藍鷹隊").locator("td");
    await expect(firstRowCells.nth(3)).toHaveText("650");
    await expect(firstRowCells.nth(4)).toHaveText("12");
    await expect(firstRowCells.nth(5)).toHaveText("20");

    // 拖曳（鍵盤）＋儲存不應開啟任何排名對話框（本頁排名表格內嵌於面板，非對話框）。
    await moveRowDownWithKeyboard(page, "藍鷹隊");
    await page.getByRole("button", { name: "儲存排名" }).click();
    await expect(page.getByRole("button", { name: "還原" })).toBeDisabled();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    // 既有的成員明細對話框仍可正常開啟／關閉。
    await page.getByText("紅鶴隊", { exact: true }).click();
    const detailDialog = page.getByRole("dialog");
    await expect(detailDialog).toBeVisible();
    await expect(detailDialog.getByText("紅鶴隊選手")).toBeVisible();
    await detailDialog.getByRole("button", { name: "確定" }).click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    // 既有的刪除確認對話框仍可正常開啟／關閉且能送出刪除。
    const deleteButton = rowByName(page, "紅鶴隊").locator("td:last-child").getByRole("button");
    await deleteButton.click();
    const deleteDialog = page.getByRole("dialog");
    await expect(deleteDialog.getByText("確定要刪除嗎？")).toBeVisible();
    await deleteDialog.getByRole("button", { name: "確定" }).click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });

  test("滑鼠拖曳可重新排序草稿，顯示之排名跟隨草稿位置", async ({ page }) => {
    await setupElimination(page);
    await gotoEliminationSchedule(page, 9100);

    const sourceHandle = dragHandle(page, "藍鷹隊");
    const source = await sourceHandle.boundingBox();
    const target = await dragHandle(page, "黑豹隊").boundingBox();
    expect(source).not.toBeNull();
    expect(target).not.toBeNull();
    await sourceHandle.hover();
    await page.mouse.down();
    await page.mouse.move(source!.x + source!.width / 2, source!.y + source!.height / 2 + 10, {
      steps: 5,
    });
    await page.waitForTimeout(100);
    await page.mouse.move(target!.x + target!.width / 2, target!.y + target!.height - 2, {
      steps: 20,
    });
    await page.waitForTimeout(100);
    await page.mouse.up();

    await expect.poll(() => tableRows(page)).toEqual([
      { rank: "1", name: "紅鶴隊" },
      { rank: "2", name: "黑豹隊" },
      { rank: "3", name: "藍鷹隊" },
      { rank: "4", name: "白狼隊" },
    ]);
  });

  test("鍵盤拖曳（Space/ArrowDown/Space）可重新排序草稿", async ({ page }) => {
    await setupElimination(page);
    await gotoEliminationSchedule(page, 9100);

    await moveRowDownWithKeyboard(page, "藍鷹隊");

    await expect.poll(() => tableRows(page)).toEqual([
      { rank: "1", name: "紅鶴隊" },
      { rank: "2", name: "藍鷹隊" },
      { rank: "3", name: "黑豹隊" },
      { rank: "4", name: "白狼隊" },
    ]);
  });

  test("還原會捨棄草稿並回復載入時之順序；草稿乾淨時停用", async ({ page }) => {
    await setupElimination(page);
    await gotoEliminationSchedule(page, 9100);

    const restoreButton = page.getByRole("button", { name: "還原" });
    await expect(restoreButton).toBeDisabled();

    await moveRowDownWithKeyboard(page, "藍鷹隊");
    await expect.poll(() => tableRows(page)).toEqual([
      { rank: "1", name: "紅鶴隊" },
      { rank: "2", name: "藍鷹隊" },
      { rank: "3", name: "黑豹隊" },
      { rank: "4", name: "白狼隊" },
    ]);
    await expect(restoreButton).toBeEnabled();

    await restoreButton.click();
    await expect.poll(() => tableRows(page)).toEqual([
      { rank: "1", name: "藍鷹隊" },
      { rank: "2", name: "紅鶴隊" },
      { rank: "3", name: "黑豹隊" },
      { rank: "4", name: "白狼隊" },
    ]);
    await expect(restoreButton).toBeDisabled();
  });

  test("儲存排名送出正確 payload，成功後新順序持久且按鈕回到乾淨狀態", async ({ page }) => {
    const { routes } = await setupElimination(page);
    await gotoEliminationSchedule(page, 9100);

    await moveRowDownWithKeyboard(page, "藍鷹隊");
    await page.getByRole("button", { name: "儲存排名" }).click();

    await expect.poll(() => routes.patchBodies).toEqual([
      {
        expected_player_set_ids: [1001, 1002, 1003, 1004],
        player_set_ids: [1002, 1001, 1003, 1004],
      },
    ]);
    await expect.poll(() => tableRows(page)).toEqual([
      { rank: "1", name: "紅鶴隊" },
      { rank: "2", name: "藍鷹隊" },
      { rank: "3", name: "黑豹隊" },
      { rank: "4", name: "白狼隊" },
    ]);
    await expect(page.getByRole("button", { name: "儲存排名" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "還原" })).toBeDisabled();
  });

  test("儲存遇 409 時保留草稿並顯示重新載入；點擊後改採伺服器最新順序", async ({ page }) => {
    const { routes } = await setupElimination(page);
    await gotoEliminationSchedule(page, 9100);

    await moveRowDownWithKeyboard(page, "藍鷹隊");
    routes.setConflictOnNextSave();
    // 模擬另一位管理員已變更伺服器上的順序，讓「重新載入」的效果可被明確驗證。
    routes.setServerRows(RELOADED_ROWS);
    await page.getByRole("button", { name: "儲存排名" }).click();

    await expect(page.getByText("名單或排名已變更；重新載入會捨棄目前草稿。")).toBeVisible();
    const reloadButton = page.getByRole("button", { name: "重新載入" });
    await expect(reloadButton).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    // 409 之後草稿應保留（未被伺服器狀態覆寫）。
    await expect.poll(() => tableRows(page)).toEqual([
      { rank: "1", name: "紅鶴隊" },
      { rank: "2", name: "藍鷹隊" },
      { rank: "3", name: "黑豹隊" },
      { rank: "4", name: "白狼隊" },
    ]);

    await reloadButton.click();
    await expect.poll(() => tableRows(page)).toEqual([
      { rank: "1", name: "白狼隊" },
      { rank: "2", name: "藍鷹隊" },
      { rank: "3", name: "紅鶴隊" },
      { rank: "4", name: "黑豹隊" },
    ]);
  });

  test("儲存遇 403 顯示權限錯誤並保留草稿", async ({ page }) => {
    const { routes } = await setupElimination(page);
    await gotoEliminationSchedule(page, 9100);

    await moveRowDownWithKeyboard(page, "藍鷹隊");
    routes.setSaveErrorOnNextSave(403);
    await page.getByRole("button", { name: "儲存排名" }).click();

    await expect(page.getByText("您沒有更新此對抗賽排名的權限。")).toBeVisible();
    await expect.poll(() => tableRows(page)).toEqual([
      { rank: "1", name: "紅鶴隊" },
      { rank: "2", name: "藍鷹隊" },
      { rank: "3", name: "黑豹隊" },
      { rank: "4", name: "白狼隊" },
    ]);
  });

  test("儲存遇 500 顯示伺服器錯誤並保留草稿", async ({ page }) => {
    const { routes } = await setupElimination(page);
    await gotoEliminationSchedule(page, 9100);

    await moveRowDownWithKeyboard(page, "藍鷹隊");
    routes.setSaveErrorOnNextSave(500);
    await page.getByRole("button", { name: "儲存排名" }).click();

    await expect(page.getByText("伺服器暫時無法儲存排名，請稍後再試。")).toBeVisible();
    await expect.poll(() => tableRows(page)).toEqual([
      { rank: "1", name: "紅鶴隊" },
      { rank: "2", name: "藍鷹隊" },
      { rank: "3", name: "黑豹隊" },
      { rank: "4", name: "白狼隊" },
    ]);
  });

  test("自動更新排名會覆寫已儲存的手動排名，並顯示覆寫提示", async ({ page }) => {
    const { routes } = await setupElimination(page);
    await gotoEliminationSchedule(page, 9100);

    // 先以手動拖曳＋儲存建立一個「已儲存」的手動順序。
    await moveRowDownWithKeyboard(page, "藍鷹隊");
    await page.getByRole("button", { name: "儲存排名" }).click();
    await expect(page.getByRole("button", { name: "還原" })).toBeDisabled();

    await expect(page.getByText("自動更新排名將覆寫手動調整結果。")).toBeVisible();
    await page.getByRole("button", { name: "自動更新排名" }).click();

    await expect.poll(() => routes.getAutoCalls()).toBe(1);
    await expect.poll(() => tableRows(page)).toEqual([
      { rank: "1", name: "黑豹隊" },
      { rank: "2", name: "藍鷹隊" },
      { rank: "3", name: "紅鶴隊" },
      { rank: "4", name: "白狼隊" },
    ]);
  });

  for (const [status, message] of [
    [403, "您沒有更新此對抗賽排名的權限。"],
    [409, "已有對抗階段，未更新排名。"],
    [500, "伺服器暫時無法更新排名，請稍後再試。"],
  ] as const) {
    test(`自動更新排名失敗（${status}）顯示對應錯誤訊息`, async ({ page }) => {
      const { routes } = await setupElimination(page);
      await gotoEliminationSchedule(page, 9100);

      routes.setAutoErrorOnNextCall(status);
      await page.getByRole("button", { name: "自動更新排名" }).click();

      await expect(page.getByText(message)).toBeVisible();
      await expect.poll(() => tableRows(page)).toEqual([
        { rank: "1", name: "藍鷹隊" },
        { rank: "2", name: "紅鶴隊" },
        { rank: "3", name: "黑豹隊" },
        { rank: "4", name: "白狼隊" },
      ]);
    });
  }

  test("已有對抗階段時，拖曳／儲存／還原／自動更新排名皆停用，且刪除按鈕隱藏", async ({
    page,
  }) => {
    await setupElimination(page, { stagesFactory: completeBracketStages });

    await gotoEliminationSchedule(page, 9100);

    await expect(page.getByText("建立狀態：完整對抗樹已建立")).toBeVisible();
    await expect(dragHandle(page, "藍鷹隊")).toBeDisabled();
    await expect(page.getByRole("button", { name: "儲存排名" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "還原" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "自動更新排名" })).toBeDisabled();
    const deleteButtons = rankingTable(page).locator("tbody tr td:last-child").getByRole("button");
    await expect(deleteButtons).toHaveCount(0);
  });
});
