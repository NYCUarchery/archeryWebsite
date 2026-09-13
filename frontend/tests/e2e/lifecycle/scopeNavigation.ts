import { expect, type Page } from "@playwright/test";

export type QualificationGroupScope = {
  name: string;
  leaderName: string;
  startLane: number;
  endLane: number;
};

function escaped(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function required<T>(value: T | undefined, message: string): T {
  expect(value, message).toBeDefined();
  return value as T;
}

/**
 * Exercises the schedule GroupMenu A → B → A and verifies the selected UI
 * controls display the separately saved lane range for each formal group.
 */
export async function assertQualificationScheduleScopes(
  page: Page,
  competitionId: number,
  first: QualificationGroupScope,
  second: QualificationGroupScope,
) {
  await page.goto(`/competition/${competitionId}/admin/schedule/qualification`);
  for (const group of [first, second, first]) {
    const names = [first.name, second.name].map(escaped).join("|");
    const trigger = page.getByRole("button", { name: new RegExp(`^(?:${names})$`) });
    await expect(trigger).toHaveCount(1);
    await trigger.click();
    const target = page.getByRole("menuitem", { name: group.name, exact: true });
    await expect(target).toBeVisible();
    await target.click();
    await expect(page.getByRole("button", { name: group.name, exact: true })).toBeVisible();
    const sliders = page.getByRole("slider");
    await expect(sliders.nth(0)).toHaveAttribute("aria-valuenow", String(group.startLane));
    await expect(sliders.nth(1)).toHaveAttribute("aria-valuenow", String(group.endLane));
  }
}

/**
 * Qualification progress itself is competition-wide and has no GroupMenu.
 * Its manual-ranking dialog is the real group-scoped progress UI.
 */
export async function assertQualificationRankingDialogScopes(
  page: Page,
  competitionId: number,
  first: QualificationGroupScope,
  second: QualificationGroupScope,
) {
  await page.goto(`/competition/${competitionId}/admin/progress/qualification`);
  await page.getByRole("button", { name: "手動調整排名", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "手動調整資格賽排名" });
  await expect(dialog).toBeVisible();
  const formalGroup = dialog.getByRole("combobox", { name: "正式組別", exact: true });
  for (const group of [first, second, first]) {
    await formalGroup.click();
    const listbox = page.getByRole("listbox");
    await listbox.getByRole("option", { name: group.name, exact: true }).click();
    await expect(listbox).toBeHidden();
    await expect(formalGroup).toContainText(group.name);
    await expect(dialog.getByText(group.leaderName, { exact: true })).toBeVisible();
  }
  await dialog.getByRole("button", { name: "取消", exact: true }).click();
  await expect(dialog).toBeHidden();
}

/** Checks the Judge's actual Select options; inactive events are omitted, not disabled. */
export async function assertJudgeEventAvailability(
  page: Page,
  competitionId: number,
  groupName: string,
  visibleEvent: "個人對抗賽" | "團體對抗賽",
  absentEvent: "個人對抗賽" | "團體對抗賽",
) {
  await page.goto(`/competition/${competitionId}/judge`);
  const group = page.getByRole("combobox", { name: "組別", exact: true });
  const event = page.getByRole("combobox", { name: "項目", exact: true });
  await group.click();
  const groupListbox = page.getByRole("listbox");
  await groupListbox.getByRole("option", { name: groupName, exact: true }).click();
  await expect(groupListbox).toBeHidden();
  await expect(group).toContainText(groupName);
  await event.click();
  const eventListbox = page.getByRole("listbox");
  const visible = eventListbox.getByRole("option", { name: visibleEvent, exact: true });
  await expect(visible).toBeVisible();
  await expect(eventListbox.getByRole("option", { name: absentEvent, exact: true })).toHaveCount(0);
  await visible.click();
  await expect(eventListbox).toBeHidden();
  await expect(event).toContainText(visibleEvent);
}

export type DivergedEliminationScope = {
  groupName: string;
  stage: number;
  end: number;
  /** The real Admin progress button label, e.g. 1/4, 準決賽, or 決賽. */
  stageLabel: string;
  /** A PlayerSet name that must appear after Judge selects Match 1. */
  setName: string;
};

function eventName(teamSize: 1 | 3) {
  return teamSize === 1 ? "個人對抗賽" : "團體對抗賽";
}

async function selectedEliminationID(page: Page, competitionId: number, groupName: string, teamSize: 1 | 3) {
  const response = await page.request.get(`/api/competition/groups/eliminations/${competitionId}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as {
    group_data: Array<{ group_name: string; elimination_data: Array<{ elimination_id: number; team_size: number }> }>;
  };
  return required(body.group_data.find((group) => group.group_name === groupName)?.elimination_data.find((item) => item.team_size === teamSize)?.elimination_id, `${groupName} team-size ${teamSize} ID`);
}

async function assertOfficialProgress(page: Page, eliminationId: number, scope: DivergedEliminationScope, teamSize: 1 | 3) {
  const response = await page.request.get(`/api/elimination/stages/scores/medals/${eliminationId}`);
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({
    id: eliminationId,
    team_size: teamSize,
    current_stage: scope.stage,
    current_end: scope.end,
  });
}

/**
 * Read-only A → B → A check for intentionally diverged events. Admin's
 * selected success-colour stage/end buttons and Judge's displayed current
 * stage plus selected Match contents must agree with the official GET state.
 */
export async function assertDivergedEliminationScopes(
  adminPage: Page,
  judgePage: Page,
  competitionId: number,
  teamSize: 1 | 3,
  first: DivergedEliminationScope,
  second: DivergedEliminationScope,
) {
  await adminPage.goto(`/competition/${competitionId}/admin/progress/elimination/${teamSize}`);
  for (const scope of [first, second, first]) {
    const names = [first.groupName, second.groupName].map(escaped).join("|");
    const trigger = adminPage.getByRole("button", { name: new RegExp(`^(?:${names})$`) });
    await expect(trigger).toHaveCount(1);
    await trigger.click();
    await adminPage.getByRole("menuitem", { name: scope.groupName, exact: true }).click();
    await expect(adminPage.getByRole("button", { name: scope.groupName, exact: true })).toBeVisible();
    const stageControl = adminPage.locator('[aria-label="直接選擇強賽"]');
    const endControl = adminPage.locator('[aria-label="直接選擇波次"]');
    await expect(stageControl.locator("button.MuiButton-colorSuccess")).toHaveText(scope.stageLabel);
    await expect(endControl.locator("button.MuiButton-colorSuccess")).toHaveText(`第 ${scope.end + 1} 波`);
    await assertOfficialProgress(adminPage, await selectedEliminationID(adminPage, competitionId, scope.groupName, teamSize), scope, teamSize);
  }

  await judgePage.goto(`/competition/${competitionId}/judge`);
  for (const scope of [first, second, first]) {
    const group = judgePage.getByRole("combobox", { name: "組別", exact: true });
    const event = judgePage.getByRole("combobox", { name: "項目", exact: true });
    await group.click();
    const groupListbox = judgePage.getByRole("listbox");
    await groupListbox.getByRole("option", { name: scope.groupName, exact: true }).click();
    await expect(groupListbox).toBeHidden();
    await expect(group).toContainText(scope.groupName);
    await event.click();
    const eventListbox = judgePage.getByRole("listbox");
    await eventListbox.getByRole("option", { name: eventName(teamSize), exact: true }).click();
    await expect(eventListbox).toBeHidden();
    await expect(event).toContainText(eventName(teamSize));
    await expect(judgePage.getByText(`目前階段：第 ${scope.stage + 1} 階段・第 ${scope.end + 1} 波`, { exact: true })).toBeVisible();
    await judgePage.getByRole("button", { name: "Match 1", exact: false }).click();
    await expect(judgePage.getByTestId("match-score-side-1").getByText(scope.setName, { exact: true })).toBeVisible();
    await assertOfficialProgress(judgePage, await selectedEliminationID(judgePage, competitionId, scope.groupName, teamSize), scope, teamSize);
  }
}
