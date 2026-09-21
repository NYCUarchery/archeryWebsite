import { expect, test } from "./fixtures";
import {
  buildEliminationFixture,
  registerEliminationRoutes,
} from "./eliminationFixtures";

const competitionId = 9850;
const userId = 9851;

function lane(id: number, laneNumber: number) {
  return {
    id,
    competition_id: competitionId,
    qualification_id: 1,
    lane_number: laneNumber,
    players: [],
  };
}

function laneScores(id: number) {
  return {
    id,
    players: Array.from({ length: 4 }, (_, index) => ({
      id: id * 10 + index,
      order: index + 1,
      rounds: [{
        id: id * 100 + index,
        round_ends: Array.from({ length: 6 }, (_, endIndex) => ({
          id: id * 1000 + index * 10 + endIndex,
          is_confirmed: false,
          round_scores: [],
        })),
      }],
    })),
  };
}

async function expectTabEdgesReachable(tablist: ReturnType<import("@playwright/test").Page["getByRole"]>) {
  const tabs = tablist.getByRole("tab");
  const first = tabs.first();
  const last = tabs.last();
  await first.scrollIntoViewIfNeeded();
  await expect(first).toBeInViewport();
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
}

for (const width of [390, 768]) {
  test(`${width}px：資格賽進度控制、lane 與雙層 Tabs 均可達`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });

    const competition = {
      id: competitionId,
      title: "E2E 窄幕資格賽",
      host_id: userId,
      rounds_num: 6,
      unassigned_group_id: 1,
      groups_num: 0,
      unassigned_lane_id: 1,
      lanes_num: 4,
      current_phase: 0,
      qualification_current_end: 0,
      qualification_is_active: true,
      elimination_is_active: false,
      team_elimination_is_active: false,
      mixed_elimination_is_active: false,
      script: "",
      groups: [],
    };
    const lanes = [lane(1, 1), lane(2, 2), lane(3, 3), lane(4, 4), lane(5, 5)];

    await page.route("**/user/me", (route) => route.fulfill({ json: { id: userId } }));
    await page.route(`**/user/${userId}`, (route) => route.fulfill({ json: { id: userId, username: "admin" } }));
    await page.route(`**/participant/competition/user/${competitionId}/${userId}`, (route) => route.fulfill({ json: [] }));
    await page.route(`**/competition/groups/${competitionId}`, (route) => route.fulfill({ json: competition }));
    await page.route(`**/competition/groups/players/${competitionId}`, (route) => route.fulfill({ json: { groups: [] } }));
    await page.route(`**/lane/all/${competitionId}`, (route) => route.fulfill({ json: lanes }));
    for (const item of lanes.slice(1)) {
      await page.route(`**/lane/scores/${item.id}`, (route) => route.fulfill({ json: laneScores(item.id) }));
    }

    await page.goto(`/competition/${competitionId}/admin/progress/qualification`);
    await expect(page.getByRole("button", { name: "手動調整排名" })).toBeVisible();
    await expect(page.getByTestId("lane-block-2")).toBeVisible();

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    const [controlBox, firstLaneBox] = await Promise.all([
      page.getByRole("button", { name: "手動調整排名" }).boundingBox(),
      page.getByTestId("lane-block-2").boundingBox(),
    ]);
    expect(controlBox).not.toBeNull();
    expect(firstLaneBox).not.toBeNull();
    expect(controlBox!.y + controlBox!.height).toBeLessThanOrEqual(firstLaneBox!.y);

    const progressTable = page.getByRole("table", { name: "資格賽進度" });
    await expect(progressTable).toBeVisible();
    const [progressContainerBox, progressLastCellBox, progressMetrics] = await Promise.all([
      progressTable.locator("..").boundingBox(),
      progressTable.locator("tbody tr").first().locator("td").last().boundingBox(),
      progressTable.locator("..").evaluate((container) => ({
        clientWidth: container.clientWidth,
        scrollWidth: container.scrollWidth,
      })),
    ]);
    expect(progressContainerBox).not.toBeNull();
    expect(progressLastCellBox).not.toBeNull();
    expect(progressMetrics.scrollWidth).toBeLessThanOrEqual(progressMetrics.clientWidth);
    expect(progressLastCellBox!.x + progressLastCellBox!.width).toBeLessThanOrEqual(
      progressContainerBox!.x + progressContainerBox!.width + 1,
    );
    expect(progressLastCellBox!.x + progressLastCellBox!.width).toBeLessThanOrEqual(width + 1);

    for (const laneNumber of [2, 3, 4, 5]) {
      const block = page.getByTestId(`lane-block-${laneNumber}`);
      const row = block.getByTestId(`lane-confirmations-${laneNumber}`);
      const cells = row.locator("td");
      const controls = row.locator("td > div");
      await expect(cells).toHaveCount(4);
      await expect(controls).toHaveCount(4);
      const [blockBox, cellBoxes, controlBoxes] = await Promise.all([
        block.boundingBox(),
        cells.evaluateAll((items) =>
          items.map((item) => item.getBoundingClientRect().toJSON()),
        ),
        controls.evaluateAll((items) =>
          items.map((item) => item.getBoundingClientRect().toJSON()),
        ),
      ]);
      expect(blockBox).not.toBeNull();
      for (let index = 0; index < cellBoxes.length; index += 1) {
        const box = cellBoxes[index];
        expect(box.left).toBeGreaterThanOrEqual(blockBox!.x);
        expect(box.right).toBeLessThanOrEqual(blockBox!.x + blockBox!.width);
        if (index > 0) expect(cellBoxes[index - 1].right).toBeLessThanOrEqual(box.left + 1);

        const controlBox = controlBoxes[index];
        expect(controlBox.left).toBeGreaterThanOrEqual(blockBox!.x);
        expect(controlBox.right).toBeLessThanOrEqual(blockBox!.x + blockBox!.width);
        if (index > 0) {
          expect(controlBoxes[index - 1].right).toBeLessThanOrEqual(controlBox.left + 1);
        }
      }
    }

    const adminTabs = page.getByRole("tablist", { name: "Administration board" });
    const progressTabs = page.getByRole("tablist", { name: "schedule panel" });
    await expectTabEdgesReachable(adminTabs);
    await expectTabEdgesReachable(progressTabs);
  });
}

test("390px：資格賽排程控制與 lane 面板上下排列且可達", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const groupId = 9860;
  const competition = {
    id: competitionId,
    title: "E2E 窄幕資格賽排程",
    host_id: userId,
    rounds_num: 6,
    unassigned_group_id: 9869,
    groups_num: 1,
    unassigned_lane_id: 9868,
    lanes_num: 4,
    current_phase: 0,
    qualification_current_end: 0,
    qualification_is_active: true,
    elimination_is_active: false,
    team_elimination_is_active: false,
    mixed_elimination_is_active: false,
    script: "",
    groups: [
      {
        id: 9869,
        competition_id: competitionId,
        group_name: "未分組",
        group_index: 0,
        players: [],
      },
      {
        id: groupId,
        competition_id: competitionId,
        group_name: "公開男子反曲弓組",
        group_index: 1,
        players: [],
      },
    ],
  };

  await page.route("**/user/me", (route) => route.fulfill({ json: { id: userId } }));
  await page.route(`**/user/${userId}`, (route) => route.fulfill({ json: { id: userId, username: "admin" } }));
  await page.route(`**/participant/competition/user/${competitionId}/${userId}`, (route) => route.fulfill({ json: [] }));
  await page.route(`**/competition/groups/${competitionId}`, (route) => route.fulfill({ json: competition }));
  await page.route(`**/competition/groups/players/${competitionId}`, (route) => route.fulfill({ json: { groups: competition.groups } }));
  await page.route(`**/groupinfo/players/${groupId}`, (route) => route.fulfill({ json: competition.groups[1] }));
  await page.route(`**/qualification/lanes/players/${groupId}`, (route) => route.fulfill({
    json: { id: groupId, start_lane: 1, end_lane: 4, advancing_num: 4, lanes: [] },
  }));
  await page.route(`**/qualification/lanes/unassigned/${groupId}`, (route) => route.fulfill({
    json: [{ id: groupId, lanes: [{ id: 9868, lane_number: 0, players: [] }] }],
  }));

  await page.goto(`/competition/${competitionId}/admin/schedule/qualification`);
  const saveButton = page.getByRole("button", { name: "儲存" });
  const laneTable = page.getByRole("table", { name: "unassigned players table" }).first();
  await expect(saveButton).toBeVisible();
  await expect(laneTable).toBeVisible();
  const [saveBox, laneBox] = await Promise.all([saveButton.boundingBox(), laneTable.boundingBox()]);
  expect(saveBox).not.toBeNull();
  expect(laneBox).not.toBeNull();
  expect(saveBox!.y + saveBox!.height).toBeLessThanOrEqual(laneBox!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expectTabEdgesReachable(page.getByRole("tablist", { name: "Administration board" }));
  await expectTabEdgesReachable(page.getByRole("tablist", { name: "schedule panel" }));
});

test("390px：對抗賽排程控制與隊伍面板上下排列且可達", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const fixture = buildEliminationFixture("individual");
  await registerEliminationRoutes(page, fixture);
  await page.route(`**/qualification/${fixture.eliminationId - 100}`, (route) => route.fulfill({
    json: { id: fixture.eliminationId - 100, advancing_num: 4 },
  }));

  await page.goto(`/competition/${fixture.competitionId}/admin/schedule/elimination/1`);
  const createButton = page.getByRole("button", { name: "建立完整對抗樹" });
  const setsTable = page.getByRole("table").first();
  await expect(createButton).toBeVisible();
  await expect(setsTable).toBeVisible();
  const [createBox, setsBox] = await Promise.all([createButton.boundingBox(), setsTable.boundingBox()]);
  expect(createBox).not.toBeNull();
  expect(setsBox).not.toBeNull();
  expect(createBox!.y + createBox!.height).toBeLessThanOrEqual(setsBox!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expectTabEdgesReachable(page.getByRole("tablist", { name: "Administration board" }));
  await expectTabEdgesReachable(page.getByRole("tablist", { name: "schedule panel" }));
});
