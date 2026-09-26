import { expect, type Page, type Response } from "@playwright/test";
import { qualificationWriteActor, type LifecycleExecutionMode } from "./execution";
import { readQualificationEnd, resolveCurrentQualificationEnd, type QualificationEndRef, type ScopedActor, writeQualificationEnd } from "./formalApi";

/** Scores a complete six-arrow end through the judge editor and confirms it. */
export async function scoreJudgeQualificationEnd(page: Page, playerName: string, endIndex: number, scores: readonly ("10" | "9" | "8")[], expected?: QualificationEndRef) {
  const selector = page.getByLabel("選手姓名");
  await selector.fill(playerName);
  await page.getByRole("option", { name: playerName, exact: true }).click();
  const editor = page.getByTestId("qualification-score-editor-table");
  const editButtons = editor.getByRole("button", { name: /編輯第1局第[1-6]波分數/ });
  await editButtons.nth(endIndex).click();
  const dialog = page.getByRole("dialog", { name: "編輯分數" });
  for (const score of scores) await dialog.getByRole("button", { name: score, exact: true }).click();
  const saved = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PATCH" && /^\/api\/player\/all-endscores\/\d+\/?$/.test(path) && candidate.status() === 200;
  });
  await dialog.getByRole("button", { name: "送出" }).click();
  const savedResponse = await saved;
  expect(savedResponse.status()).toBe(200);
  if (expected) {
    expect(new URL(savedResponse.url()).pathname).toBe(`/api/player/all-endscores/${expected.endId}`);
    expect(savedResponse.request().postDataJSON()).toEqual({ scores: scores.map(Number) });
  }
  await expect(dialog).toBeHidden();
  await editor.getByRole("button", { name: /編輯第1局第[1-6]波分數/ }).nth(endIndex).click();
  const confirmDialog = page.getByRole("dialog", { name: "編輯分數" });
  const confirmed = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PATCH" && /^\/api\/player\/isconfirmed\/\d+\/?$/.test(path) && candidate.status() === 200;
  });
  await confirmDialog.getByRole("button", { name: "確認" }).click();
  const confirmResponse = await confirmed;
  expect(confirmResponse.status()).toBe(200);
  if (expected) {
    expect(new URL(confirmResponse.url()).pathname).toBe(`/api/player/isconfirmed/${expected.endId}`);
    expect(confirmResponse.request().postDataJSON()).toEqual({ is_confirmed: true });
  }
  await expect(confirmDialog).toBeHidden();
  // Reopen once to make the server-confirmed state visible before selecting a
  // different archer; the table itself only renders score totals.
  await editor.getByRole("button", { name: /編輯第1局第[1-6]波分數/ }).nth(endIndex).click();
  await expect(page.getByRole("dialog", { name: "編輯分數" }).getByText("已確認（改分後維持確認）")).toBeVisible();
  await page.getByRole("dialog", { name: "編輯分數" }).getByRole("button", { name: "取消" }).click();
  await expect(page.getByRole("dialog", { name: "編輯分數" })).toBeHidden();
}

/** Shared qualification scorer: UI samples stay visible; remaining ends use the approved Judge API session. */
export async function scoreQualificationEndByMode(input: {
  mode: LifecycleExecutionMode;
  judgePage: Page;
  judgeActor: Omit<ScopedActor, "groupName">;
  playerName: string;
  archerIndex: number;
  groupName: string;
  endIndex: number;
  scores: readonly ("10" | "9" | "8")[];
  recordUi?: () => void;
  recordApi?: () => void;
}) {
  const actor = qualificationWriteActor(input.archerIndex, input.endIndex);
  if (input.mode === "full-ui" || actor === "judge-ui") {
    const ref = await resolveCurrentQualificationEnd(input.judgePage.request, { ...input.judgeActor, groupName: input.groupName }, input.playerName);
    if (ref.endIndex !== input.endIndex) throw new Error(`qualification UI resolved end ${ref.endIndex}, expected ${input.endIndex}`);
    await scoreJudgeQualificationEnd(input.judgePage, input.playerName, input.endIndex, input.scores, ref);
    await readQualificationEnd(input.judgePage.request, ref, input.scores.map(Number));
    input.recordUi?.();
    return;
  }
  if (actor !== "api") throw new Error(`unknown qualification strategy for ${input.playerName} end ${input.endIndex + 1}`);
  const judgeActor = { ...input.judgeActor, groupName: input.groupName };
  const ref = await resolveCurrentQualificationEnd(input.judgePage.request, judgeActor, input.playerName);
  if (ref.endIndex !== input.endIndex) throw new Error(`qualification API resolved end ${ref.endIndex}, expected ${input.endIndex}`);
  await writeQualificationEnd(input.mode, input.judgePage.request, judgeActor, ref, input.scores.map(Number));
  input.recordApi?.();
}

/** Advances the shared qualification end only after both groups are confirmed. */
export async function advanceQualification(page: Page, competitionId: number) {
  await page.goto(`/competition/${competitionId}/admin/progress/qualification`);
  await page.getByRole("button", { name: "下一波" }).click();
  await expect(page.getByText("成功進到下一波")).toBeVisible();
}

export async function updateQualificationRanking(page: Page, competitionId: number) {
  await page.goto(`/competition/${competitionId}/admin/progress/qualification`);
  const updated = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PATCH" &&
      path === `/api/competition/refresh/groups/players/rank/${competitionId}` &&
      candidate.status() === 200;
  });
  await page.getByRole("button", { name: "自動更新排名" }).click();
  await updated;
  await expect(page.getByText("自動更新排名成功", { exact: true })).toBeVisible();
}

export async function activateQualification(page: Page, competitionId: number) {
  await page.goto(`/competition/${competitionId}/admin/schedule/activation`);
  const activation = page.getByRole("group", { name: "開啟賽程" });
  await activation.getByRole("button", { name: "資格賽" }).click();
  await expect(activation.getByRole("button", { name: "資格賽" })).toBeDisabled();
}

export type QualificationBatchPatch = { endId: number; scores: readonly number[] };
export type ObservedQualificationBatchPatch = { endId: number; status: number; scores: readonly number[] };

/** Order-independent lane-batch proof: no extra end may be patched. */
export function assertQualificationBatchPatches(expected: readonly QualificationBatchPatch[], observed: readonly ObservedQualificationBatchPatch[]) {
  if (expected.length !== observed.length) throw new Error(`qualification batch response count ${observed.length}, expected ${expected.length}`);
  const expectedById = new Map(expected.map((patch) => [patch.endId, patch.scores.join(",")]));
  if (expectedById.size !== expected.length) throw new Error("qualification batch expected duplicate end ID");
  for (const patch of observed) {
    if (patch.status !== 200 || expectedById.get(patch.endId) !== patch.scores.join(",")) throw new Error(`qualification batch response outside lane scope or wrong payload for end ${patch.endId}`);
    expectedById.delete(patch.endId);
  }
  if (expectedById.size) throw new Error(`qualification batch omitted ends ${[...expectedById.keys()].join(",")}`);
}

async function laneBatch(page: Page, selected: QualificationEndRef, scores: readonly ("10" | "9" | "8")[]): Promise<QualificationBatchPatch[]> {
  const response = await page.request.get(`/api/lane/scores/${selected.laneId}`);
  expect(response.ok()).toBeTruthy();
  const lane = await response.json() as { players?: Array<{ rounds?: Array<{ round_ends?: Array<{ id?: number; round_scores?: Array<{ score?: number }> }> }> }> };
  const players = lane.players ?? [];
  if (players.length !== 2) throw new Error(`qualification lane ${selected.laneId} must contain exactly two players, got ${players.length}`);
  const ends = players.map((player, index) => {
    const end = player.rounds?.flatMap((round) => round.round_ends ?? [])[selected.endIndex];
    if (!end?.id || end.round_scores?.length !== 6) throw new Error(`qualification lane player ${index + 1} lacks a six-arrow current end`);
    return end as { id: number; round_scores: Array<{ score?: number }> };
  });
  if (new Set(ends.map((end) => end.id)).size !== 2 || ends.filter((end) => end.id === selected.endId).length !== 1) {
    throw new Error("qualification lane current ends do not contain one selected end and one mate end");
  }
  const patches = ends.map((end) => ({ endId: end.id, scores: end.id === selected.endId ? scores.map(Number) : end.round_scores.map((score) => score.score ?? -1) }));
  return patches.filter((patch) => patch.endId === selected.endId);
}

async function observeLaneBatch(page: Page, expected: readonly QualificationBatchPatch[], trigger: () => Promise<void>) {
  const observed: ObservedQualificationBatchPatch[] = [];
  const listener = (response: Response) => {
    if (response.request().method() !== "PATCH") return;
    const match = /^\/api\/player\/all-endscores\/(\d+)\/?$/.exec(new URL(response.url()).pathname);
    if (!match) return;
    const endId = Number(match[1]);
    if (!expected.some((patch) => patch.endId === endId)) {
      observed.push({ endId, status: response.status(), scores: [] });
      return;
    }
    const payload = response.request().postDataJSON() as { scores?: number[] };
    observed.push({ endId, status: response.status(), scores: payload.scores ?? [] });
  };
  page.on("response", listener);
  try {
    await trigger();
    await expect.poll(() => observed.length).toBe(expected.length);
  } finally {
    page.off("response", listener);
  }
  assertQualificationBatchPatches(expected, observed);
}

export async function scorePlayerQualificationEnd(page: Page, scores: readonly ("10" | "9" | "8")[], expected?: QualificationEndRef) {
  await page.locator(".player_button_group button").first().click();
  if (scores.length !== 6) throw new Error("qualification player scoring requires exactly six arrows");
  // Filling arrow six triggers the board's automatic save.  Observe it before
  // the explicit Send action so both writes have completed deterministically.
  const batch = expected ? await laneBatch(page, expected, scores) : undefined;
  for (const score of scores.slice(0, -1)) await page.getByRole("button", { name: score, exact: true }).click();
  if (batch) await observeLaneBatch(page, batch, () => page.getByRole("button", { name: scores.at(-1)!, exact: true }).click());
  else await page.getByRole("button", { name: scores.at(-1)!, exact: true }).click();
  if (batch) await observeLaneBatch(page, batch, () => page.getByRole("button", { name: "送出" }).click());
  else await page.getByRole("button", { name: "送出" }).click();
  await expect(page.getByText("分數已送出")).toBeVisible();
  const confirmed = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PATCH" && /^\/api\/player\/isconfirmed\/\d+\/?$/.test(path) && candidate.status() === 200;
  });
  await page.getByRole("button", { name: "確認" }).click();
  const confirmedResponse = await confirmed;
  expect(confirmedResponse.status()).toBe(200);
  if (expected) {
    expect(new URL(confirmedResponse.url()).pathname).toBe(`/api/player/isconfirmed/${expected.endId}`);
    expect(confirmedResponse.request().postDataJSON()).toEqual({ is_confirmed: true });
  }
  await expect(page.getByRole("button", { name: "已確認" })).toBeVisible();
}
