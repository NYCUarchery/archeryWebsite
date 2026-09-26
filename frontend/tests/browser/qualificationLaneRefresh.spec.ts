import { expect, test } from "./fixtures";

const competitionId = 9890;
const userId = 9891;
const participantId = 9892;
const playerId = 9893;
const groupId = 9894;
const unassignedLaneId = 9895;
const targetLaneId = 9896;

function scorePlayer(id: number, name: string, order: number, confirmed = false) {
  return {
    id,
    name,
    order,
    rounds: [{
      id: id * 10,
      round_ends: Array.from({ length: 6 }, (_, index) => ({
        id: id * 100 + index,
        is_confirmed: confirmed,
        round_scores: Array.from({ length: 6 }, () => ({ score: confirmed ? 10 : -1 })),
      })),
    }],
  };
}

test("選手分道後，計分頁刷新本人靶道與同靶名單", async ({ page }) => {
  let assigned = false;
  let rosterRequests = 0;
  const patchedEndIds: number[] = [];
  const competition = {
    id: competitionId,
    title: "測試賽事",
    current_phase: 0,
    qualification_current_end: 0,
    rounds_num: 1,
    groups: [{ id: groupId, group_name: "反曲弓組" }],
  };

  await page.route("**/api/user/me", (route) => route.fulfill({ json: { id: userId } }));
  await page.route(`**/api/user/${userId}`, (route) => route.fulfill({
    json: { id: userId, real_name: "李庭寬", role: "User" },
  }));
  await page.route(`**/api/participant/competition/user/${competitionId}/${userId}`, (route) => route.fulfill({
    json: [{ id: participantId, competition_id: competitionId, user_id: userId, role: "Player", status: "approved" }],
  }));
  await page.route(`**/api/competition/groups/${competitionId}`, (route) => route.fulfill({ json: competition }));
  await page.route(`**/api/competition/${competitionId}`, (route) => route.fulfill({ json: competition }));
  await page.route(`**/api/competition/groups/players/${competitionId}`, (route) => {
    rosterRequests += 1;
    return route.fulfill({
      json: {
        groups: [{
          id: groupId,
          players: [{
            id: playerId,
            participant_id: participantId,
            group_id: groupId,
            lane_id: assigned ? targetLaneId : unassignedLaneId,
            order: assigned ? 3 : 0,
            name: "李庭寬",
          }],
        }],
      },
    });
  });
  await page.route(`**/api/lane/scores/${unassignedLaneId}`, (route) => route.fulfill({
    json: {
      id: unassignedLaneId,
      lane_number: 0,
      players: [scorePlayer(playerId, "李庭寬", 0), scorePlayer(9897, "同批選手", 0)],
    },
  }));
  await page.route(`**/api/lane/scores/${targetLaneId}`, (route) => route.fulfill({
    json: {
      id: targetLaneId,
      lane_number: 5,
      players: [scorePlayer(9898, "五A選手", 1, true), scorePlayer(9899, "五B選手", 2, true), scorePlayer(playerId, "李庭寬", 3)],
    },
  }));

  await page.route("**/api/player/all-endscores/*", (route) => {
    const endId = Number(new URL(route.request().url()).pathname.split("/").pop());
    patchedEndIds.push(endId);
    return route.fulfill(endId === playerId * 100
      ? { json: null }
      : { status: 403, json: { error: "Approved competition scoring role required" } });
  });

  await page.goto(`/competition/${competitionId}/scoring`);
  await expect(page.getByText("同批選手")).toBeVisible();
  const requestsBeforeAssignment = rosterRequests;

  assigned = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect.poll(() => rosterRequests).toBeGreaterThan(requestsBeforeAssignment);
  await expect(page.getByText("五A選手")).toBeVisible();
  await expect(page.getByText("同批選手")).toHaveCount(0);

  const saveButton = page.getByRole("button", { name: "送出", exact: true });
  await expect(saveButton).toBeDisabled();
  await page.locator(".player_button_group button").filter({ hasText: "五A選手" }).click();
  await expect(saveButton).toBeDisabled();
  await page.locator(".player_button_group button").filter({ hasText: "李庭寬" }).click();
  await expect(saveButton).toBeEnabled();
  await page.getByRole("button", { name: "10", exact: true }).click();
  await saveButton.click();
  await expect(page.getByText("分數已送出")).toBeVisible();
  expect(patchedEndIds).toEqual([playerId * 100]);

  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: "10", exact: true }).click();
  }
  await expect.poll(() => patchedEndIds.length).toBe(2);
  expect(patchedEndIds).toEqual([playerId * 100, playerId * 100]);
});
