import { expect, type Page } from "@playwright/test";
import { selectGroup } from "./actors";

export async function assignPlayersToGroup(page: Page, competitionId: number, playerNames: string[], groupName: string) {
  await page.goto(`/competition/${competitionId}/admin/groups`);
  // GroupGrid renders the unassigned group first; its heading is a sibling of
  // the grid, so use the first grid instead of relying on nested text.
  const unassigned = page.locator(".MuiDataGrid-root").first();
  const scroller = unassigned.locator(".MuiDataGrid-virtualScroller");
  const findRow = async (playerName: string) => {
    for (let offset = 0; offset <= 2_000; offset += 240) {
      await scroller.evaluate((element, top) => { element.scrollTop = top; }, offset);
      // MUI DataGrid virtualizes after the scroll event; give React one tick
      // before querying the newly rendered window.
      await page.waitForTimeout(50);
      const row = unassigned.getByRole("row").filter({ hasText: playerName });
      if (await row.count()) return row;
    }
    throw new Error(`${playerName} did not render in the unassigned DataGrid`);
  };
  for (const playerName of playerNames) {
    const row = await findRow(playerName);
    await row.getByRole("checkbox").check();
  }
  // One Admin action deliberately exercises GroupGrid's bulk path.  Collect
  // every distinct PATCH result instead of trusting its final React Query
  // invalidation callback.
  const patchResults = new Map<string, number>();
  const recordPatch = (response: import("@playwright/test").Response) => {
    const path = new URL(response.url()).pathname;
    if (response.request().method() === "PATCH" && /^\/api\/player\/group\/\d+\/?$/.test(path)) patchResults.set(path, response.status());
  };
  page.on("response", recordPatch);
  try {
    await unassigned.getByRole("button", { name: "指定組別" }).click();
    const dialog = page.getByRole("dialog", { name: "指定組別" });
    await dialog.getByRole("combobox").click();
    await page.getByRole("option", { name: groupName, exact: true }).click();
    await dialog.getByRole("button", { name: "確認" }).click();
    await expect.poll(() => patchResults.size, { timeout: 30_000 }).toBe(playerNames.length);
    expect([...patchResults.values()]).toEqual(Array(playerNames.length).fill(200));
  } finally {
    page.off("response", recordPatch);
  }
  await expect.poll(async () => {
    const response = await page.request.get(`/api/competition/groups/players/${competitionId}`);
    const body = await response.json() as { groups: Array<{ group_name: string; players: Array<{ name: string }> }> };
    return body.groups.find((group) => group.group_name === groupName)?.players.map((player) => player.name).sort();
  }, { timeout: 30_000 }).toEqual([...playerNames].sort());
}

export async function saveQualificationSettings(page: Page, competitionId: number, groupName: string, advancing: number) {
  await page.goto(`/competition/${competitionId}/admin/schedule/qualification`);
  await selectGroup(page, groupName, competitionId);
  const sliders = page.getByRole("slider");
  // The first two handles belong to the lane range.  Set literal per-group
  // ranges before filling lanes: A=1–6, B=7–12.
  const startLane = groupName.includes("反曲") ? 1 : 7;
  const endLane = startLane + 5;
  const startHandle = sliders.nth(0);
  const endHandle = sliders.nth(1);
  // The controlled range starts as [0, 0]. Establish the upper bound before
  // moving the lower thumb, otherwise MUI swaps thumbs when start > end.
  await endHandle.focus();
  await endHandle.press("End");
  await startHandle.focus();
  await startHandle.press("Home");
  for (let value = 1; value < startLane; value += 1) await startHandle.press("ArrowRight");
  await endHandle.focus();
  await endHandle.press("End");
  for (let value = 12; value > endLane; value -= 1) await endHandle.press("ArrowLeft");
  await expect(startHandle).toHaveAttribute("aria-valuenow", String(startLane));
  await expect(endHandle).toHaveAttribute("aria-valuenow", String(endLane));
  // The final single-handle Slider is the individual advancing count.
  const slider = sliders.last();
  await slider.focus();
  // Do not depend on a previous group setting: Home establishes the lower
  // bound before selecting the literal advancing count.
  await slider.press("Home");
  for (let value = 1; value < advancing; value += 1) await slider.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", String(advancing));
  const saved = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PUT" && /^\/api\/qualification\/\d+\/?$/.test(path) && candidate.status() === 200;
  });
  await page.getByRole("button", { name: "儲存" }).click();
  const savedResponse = await saved;
  expect(await savedResponse.json()).toMatchObject({ start_lane: startLane, end_lane: endLane, advancing_num: advancing });
}

export async function assignQualificationLanes(page: Page, competitionId: number, groupName: string, playerNames: string[], firstLane: number) {
  await page.goto(`/competition/${competitionId}/admin/schedule/qualification`);
  await selectGroup(page, groupName, competitionId);
  const tables = page.getByRole("table", { name: "unassigned players table" });
  await expect(tables).toHaveCount(2);
  const unassigned = tables.first();
  const laneTable = tables.nth(1);
  for (const [index, playerName] of playerNames.entries()) {
    await unassigned.getByRole("row").filter({ hasText: playerName }).click();
    const lane = firstLane + Math.floor(index / 2);
    // LaneBlock marks the lane number and the A/B/C/D cells as table headers.
    // The number is the only exact rowheader match, so derive its own row in
    // the second table rather than accidentally matching an unassigned row.
    const laneRow = laneTable.getByRole("rowheader", { name: String(lane), exact: true }).locator("xpath=..");
    // Slots are A/B/C/D in DOM order. Selecting the fixed target index keeps
    // the second archer on B even after A changed from "空" to a name.
    const slot = laneRow.getByRole("button").nth(index % 2);
    const laneSaved = page.waitForResponse((candidate) => {
      const path = new URL(candidate.url()).pathname;
      return candidate.request().method() === "PATCH" && /^\/api\/player\/lane\/\d+\/?$/.test(path);
    });
    const orderSaved = page.waitForResponse((candidate) => {
      const path = new URL(candidate.url()).pathname;
      return candidate.request().method() === "PATCH" && /^\/api\/player\/order\/\d+\/?$/.test(path);
    });
    await slot.click();
    const [laneResponse, orderResponse] = await Promise.all([laneSaved, orderSaved]);
    expect(laneResponse.status()).toBe(200);
    expect(orderResponse.status()).toBe(200);
    // Each mutation clears selectedPlayer on success.  Do not select the next
    // archer until both writes and the rendered slot agree on this one.
    await expect(slot).toContainText(playerName);
  }
}
