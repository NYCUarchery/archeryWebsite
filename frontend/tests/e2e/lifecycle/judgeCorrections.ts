import { expect, type Locator, type Page } from "@playwright/test";

type Arrow = "9" | "10";

type QualificationCorrection = {
  competitionId: number;
  playerName: string;
  endIndex: number;
  provisional: readonly Arrow[];
  expected: readonly Arrow[];
  /** Exercise a changed draft, retain it across return/reopen, then save it. */
  preserveDraft?: boolean;
};

type EliminationCorrection = {
  eliminationId: number;
  wave: number;
  side: 1 | 2;
  provisional: readonly Arrow[];
  expected: readonly Arrow[];
  expectedPoints: number;
  expectedCumulativePoints: number;
  /** A group switch must retain this event, match and unsaved draft. */
  attemptOtherGroup?: string;
};

type RoundEnd = {
  id?: number;
  is_confirmed?: boolean;
  round_scores?: Array<{ score?: number }>;
};

type QualificationPlayer = {
  id?: number;
  name?: string;
  total_score?: number;
  rounds?: Array<{ round_ends?: RoundEnd[] }>;
};

type MatchEnd = {
  id?: number;
  is_confirmed?: boolean;
  total_scores?: number;
  points?: number | null;
  cumulative_points?: number;
  match_scores?: Array<{ score?: number }>;
};

type EliminationDetail = {
  current_stage?: number;
  stages?: Array<{ matchs?: Array<{ match_results?: Array<{ match_ends?: MatchEnd[] }> }> }>;
};

const scoreValues = (scores: readonly Arrow[]) => scores.map(Number);
const scoreTotal = (scores: readonly Arrow[]) => scoreValues(scores).reduce((total, score) => total + score, 0);

function editorDeleteButton(dialog: Locator) {
  // ControllButtonGroup renders confirm/send/delete in that order. The delete
  // button has an icon only, so no inaccessible name is guessed here.
  return dialog.locator(".controll_button_group button").last();
}

async function replaceArrows(dialog: Locator, from: readonly Arrow[], to: readonly Arrow[]) {
  const deleteButton = editorDeleteButton(dialog);
  for (let index = 0; index < from.length; index += 1) {
    await expect(deleteButton).toBeEnabled();
    await deleteButton.click();
  }
  for (const score of to) await dialog.getByRole("button", { name: score, exact: true }).click();
}

function waitForPatch(page: Page, route: RegExp) {
  return page.waitForResponse((response) =>
    response.request().method() === "PATCH" && route.test(new URL(response.url()).pathname) && response.status() === 200,
  );
}

function resourceId(response: { url(): string }, route: RegExp) {
  const found = new URL(response.url()).pathname.match(route);
  expect(found?.[1], "PATCH resource id").toBeTruthy();
  return Number(found![1]);
}

function qualificationEnd(player: QualificationPlayer, endIndex: number) {
  const end = player.rounds?.flatMap((round) => round.round_ends ?? [])[endIndex];
  expect(end, `qualification end ${endIndex + 1}`).toBeTruthy();
  return end!;
}

function expectArrows(actual: Array<{ score?: number }> | undefined, expected: readonly Arrow[]) {
  expect(actual?.map((score) => score.score)).toEqual(scoreValues(expected));
}

async function officialQualificationPlayer(page: Page, competitionId: number, playerName: string) {
  const roster = await page.request.get(`/api/competition/groups/players/${competitionId}`);
  expect(roster.ok(), "official competition roster").toBeTruthy();
  const rosterBody = await roster.json() as { groups?: Array<{ players?: QualificationPlayer[] }> };
  const player = rosterBody.groups?.flatMap((group) => group.players ?? []).find((candidate) => candidate.name === playerName);
  expect(player?.id, `official roster player ${playerName}`).toBeTruthy();
  const detail = await page.request.get(`/api/player/scores/${player!.id}`);
  expect(detail.ok(), "official qualification score detail").toBeTruthy();
  return { player: await detail.json() as QualificationPlayer };
}

async function assertQualificationReadback(page: Page, options: QualificationCorrection, expectedTotal: number) {
  const { player } = await officialQualificationPlayer(page, options.competitionId, options.playerName);
  const end = qualificationEnd(player, options.endIndex);
  expect(end.is_confirmed).toBe(true);
  expectArrows(end.round_scores, options.expected);
  expect(player.total_score).toBe(expectedTotal);
}

function qualificationEndButton(page: Page, endIndex: number) {
  return page.getByTestId("qualification-score-editor-table").getByRole("button", { name: /編輯第1局第[1-6]波分數/ }).nth(endIndex);
}

/** Correct a confirmed qualification end and verify its official persisted score. */
export async function correctConfirmedQualificationEnd(page: Page, options: QualificationCorrection) {
  const before = await officialQualificationPlayer(page, options.competitionId, options.playerName);
  const beforeEnd = qualificationEnd(before.player, options.endIndex);
  expect(beforeEnd.is_confirmed).toBe(true);
  expectArrows(beforeEnd.round_scores, options.provisional);
  const expectedPlayerTotal = (before.player.total_score ?? 0) - scoreTotal(options.provisional) + scoreTotal(options.expected);

  await page.getByLabel("選手姓名").fill(options.playerName);
  await page.getByRole("option", { name: options.playerName, exact: true }).click();
  await qualificationEndButton(page, options.endIndex).click();
  const dialog = page.getByRole("dialog", { name: "編輯分數" });
  await expect(dialog.getByText("已確認（改分後維持確認）")).toBeVisible();
  await replaceArrows(dialog, options.provisional, options.expected);
  const corrected = waitForPatch(page, /^\/api\/player\/all-endscores\/(\d+)\/?$/);
  await dialog.getByRole("button", { name: "送出", exact: true }).click();
  const correctedEndId = resourceId(await corrected, /^\/api\/player\/all-endscores\/(\d+)\/?$/);
  expect(correctedEndId).toBe(beforeEnd.id);
  await expect(dialog).toBeHidden();

  if (options.preserveDraft) {
    // Change a real arrow, retain it across return/reopen, then restore and
    // save it. The qualification score is therefore still the planned value.
    await qualificationEndButton(page, options.endIndex).click();
    await editorDeleteButton(dialog).click();
    await dialog.getByRole("button", { name: "9", exact: true }).click();
    await dialog.getByRole("button", { name: "保留草稿並返回", exact: true }).click();
    await expect(dialog).toBeHidden();
    await qualificationEndButton(page, options.endIndex).click();
    await expect(dialog.locator(".score_block").allTextContents()).resolves.toEqual([...options.expected.slice(0, -1), "9"]);
    await editorDeleteButton(dialog).click();
    await dialog.getByRole("button", { name: options.expected.at(-1)!, exact: true }).click();
    const restored = waitForPatch(page, /^\/api\/player\/all-endscores\/(\d+)\/?$/);
    await dialog.getByRole("button", { name: "送出", exact: true }).click();
    expect(resourceId(await restored, /^\/api\/player\/all-endscores\/(\d+)\/?$/)).toBe(beforeEnd.id);
    await expect(dialog).toBeHidden();
  }

  await assertQualificationReadback(page, options, expectedPlayerTotal);
}

function eliminationEnd(detail: EliminationDetail, endId: number) {
  const end = detail.stages
    ?.flatMap((stage) => stage.matchs ?? [])
    .flatMap((match) => match.match_results ?? [])
    .flatMap((result) => result.match_ends ?? [])
    .find((candidate) => candidate.id === endId);
  expect(end, `elimination MatchEnd ${endId}`).toBeTruthy();
  return end!;
}

async function assertEliminationReadback(page: Page, options: EliminationCorrection, endId: number) {
  const response = await page.request.get(`/api/elimination/stages/scores/medals/${options.eliminationId}`);
  expect(response.ok(), "official elimination score detail").toBeTruthy();
  const end = eliminationEnd(await response.json() as EliminationDetail, endId);
  expect(end.is_confirmed).toBe(true);
  expect(end.total_scores).toBe(scoreTotal(options.expected));
  expectArrows(end.match_scores, options.expected);
  expect(end.points).toBe(options.expectedPoints);
  expect(end.cumulative_points).toBe(options.expectedCumulativePoints);
}

function matchEndCell(page: Page, wave: number, side: 1 | 2) {
  return page.getByTestId(`match-score-end-${wave}-side-${side}`);
}

async function selectedMatchEnd(page: Page, options: EliminationCorrection, matchHeader: Locator) {
  const matchText = await matchHeader.textContent();
  const matchNumber = Number(matchText?.match(/^Match (\d+) 比分$/)?.[1]);
  expect(matchNumber, "selected Match number").toBeGreaterThan(0);
  const response = await page.request.get(`/api/elimination/stages/scores/medals/${options.eliminationId}`);
  expect(response.ok(), "official elimination score detail before correction").toBeTruthy();
  const detail = await response.json() as EliminationDetail;
  const stage = detail.stages?.[detail.current_stage ?? -1];
  const end = stage?.matchs?.[matchNumber - 1]?.match_results?.[options.side - 1]?.match_ends?.[options.wave - 1];
  expect(end?.id, "selected MatchEnd from official detail").toBeTruthy();
  return end!;
}

/** Correct a confirmed individual/team MatchEnd and verify its official persisted score. */
export async function correctConfirmedEliminationEnd(page: Page, options: EliminationCorrection) {
  const cell = matchEndCell(page, options.wave, options.side);
  const originalMatchHeader = page.getByText(/^Match \d+ 比分$/).first();
  await expect(originalMatchHeader).toBeVisible();
  const originalMatchText = await originalMatchHeader.textContent();
  const groupCombobox = page.getByRole("combobox", { name: "組別", exact: true });
  const eventCombobox = page.getByRole("combobox", { name: "項目", exact: true });
  const originalGroup = await groupCombobox.textContent();
  const originalEvent = await eventCombobox.textContent();
  const persistedEnd = await selectedMatchEnd(page, options, originalMatchHeader);
  expect(persistedEnd.is_confirmed).toBe(true);
  expectArrows(persistedEnd.match_scores, options.provisional);
  await expect(cell.locator(".score_block").allTextContents()).resolves.toEqual([...options.provisional]);

  await cell.getByRole("button", { name: "編輯本波分數", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: `編輯第 ${options.wave} 波` });
  await expect(dialog.getByText("已確認（改分後維持確認）")).toBeVisible();
  await replaceArrows(dialog, options.provisional, options.expected);
  const corrected = waitForPatch(page, /^\/api\/matchresult\/matchend\/scores\/(\d+)\/?$/);
  await dialog.getByRole("button", { name: "送出", exact: true }).click();
  const endId = resourceId(await corrected, /^\/api\/matchresult\/matchend\/scores\/(\d+)\/?$/);
  expect(endId).toBe(persistedEnd.id);
  await expect(dialog).toBeHidden();

  if (options.attemptOtherGroup) {
    await cell.getByRole("button", { name: "編輯本波分數", exact: true }).click();
    await editorDeleteButton(dialog).click();
    await dialog.getByRole("button", { name: "9", exact: true }).click();
    await dialog.getByRole("button", { name: "保留草稿並返回", exact: true }).click();
    await expect(dialog).toBeHidden();

    await groupCombobox.click();
    const groupListbox = page.getByRole("listbox");
    await groupListbox.getByRole("option", { name: options.attemptOtherGroup, exact: true }).click();
    await expect(groupListbox).toBeHidden();
    await expect(page.getByText("此波尚有未儲存草稿；請先送出，或保留草稿後再處理目前範圍。")).toBeVisible();
    await expect(groupCombobox).toHaveText(originalGroup ?? "");
    await expect(eventCombobox).toHaveText(originalEvent ?? "");
    await expect(originalMatchHeader).toHaveText(originalMatchText ?? "");

    await cell.getByRole("button", { name: "編輯本波分數", exact: true }).click();
    await expect(dialog.locator(".score_block").allTextContents()).resolves.toEqual([...options.expected.slice(0, -1), "9"]);
    await editorDeleteButton(dialog).click();
    await dialog.getByRole("button", { name: options.expected.at(-1)!, exact: true }).click();
    const restored = waitForPatch(page, /^\/api\/matchresult\/matchend\/scores\/(\d+)\/?$/);
    await dialog.getByRole("button", { name: "送出", exact: true }).click();
    expect(resourceId(await restored, /^\/api\/matchresult\/matchend\/scores\/(\d+)\/?$/)).toBe(persistedEnd.id);
    await expect(dialog).toBeHidden();
  }

  await assertEliminationReadback(page, options, endId);
}
