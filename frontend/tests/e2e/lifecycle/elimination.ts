import { expect, test, type Page } from "@playwright/test";
import { selectGroup } from "./actors";

type Bow = "recurve" | "compound";
type TeamSize = 1 | 3;
type Score = "10" | "9";
type JudgeMatchScope = {
  adminPage: Page; competitionId: number; groupName: string; teamSize: TeamSize; stage: "1/4" | "準決賽" | "決賽";
  /** Literal provisional final-wave winner arrows, corrected before advancement. */
  lastWaveWinnerScores?: readonly Score[];
};

export async function chooseJudgeIndividual(page: Page, groupName: string) {
  await chooseJudgeEvent(page, groupName, "個人對抗賽");
}
export async function chooseJudgeTeam(page: Page, groupName: string) {
  await chooseJudgeEvent(page, groupName, "團體對抗賽");
}
async function chooseJudgeEvent(page: Page, groupName: string, event: "個人對抗賽" | "團體對抗賽") {
  await chooseJudgeOption(page, "組別", groupName);
  await chooseJudgeOption(page, "項目", event);
  await expect(page.getByText("目前階段：", { exact: false })).toBeVisible();
}

async function chooseJudgeOption(page: Page, label: "組別" | "項目", optionName: string) {
  const combobox = page.getByRole("combobox", { name: label, exact: true });
  await combobox.click();
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option", { name: optionName, exact: true }).click();
  await expect(listbox).toBeHidden();
  await expect(combobox).toContainText(optionName);
}
function waveCell(page: Page, wave: number, side: 1 | 2) {
  return page.getByTestId(`match-score-end-${wave}-side-${side}`);
}
function total(scores: readonly Score[]) { return scores.reduce((sum, score) => sum + Number(score), 0); }
async function scoreSide(page: Page, wave: number, side: 1 | 2, scores: readonly Score[]) {
  const cell = waveCell(page, wave, side);
  await cell.getByRole("button", { name: "編輯本波分數" }).click();
  const dialog = page.getByRole("dialog", { name: `編輯第 ${wave} 波` });
  await expect(dialog).toBeVisible();
  for (const score of scores) await dialog.getByRole("button", { name: score, exact: true }).click();
  const saved = page.waitForResponse((candidate) => candidate.request().method() === "PATCH" &&
    /^\/api\/matchresult\/matchend\/scores\/\d+\/?$/.test(new URL(candidate.url()).pathname) && candidate.status() === 200);
  await dialog.getByRole("button", { name: "送出", exact: true }).click();
  await saved;
  await expect(dialog).toBeHidden();
  await expect.poll(() => cell.locator(".score_block").allTextContents()).toEqual([...scores]);
  await expect(cell.getByLabel(`箭分總分：${total(scores)}`)).toBeVisible();
}
async function confirmSide(page: Page, wave: number, side: 1 | 2) {
  const cell = waveCell(page, wave, side);
  const confirmed = page.waitForResponse((candidate) => candidate.request().method() === "PATCH" &&
    /^\/api\/matchresult\/matchend\/isconfirmed\/\d+\/?$/.test(new URL(candidate.url()).pathname) && candidate.status() === 200);
  await cell.getByRole("button", { name: "切換為已確認", exact: true }).click();
  await confirmed;
  await expect.poll(() => cell.locator("[data-status]").getAttribute("data-status")).toBe("confirmed");
}
function waves(bow: Bow, teamSize: TeamSize) { return teamSize === 3 ? (bow === "recurve" ? 3 : 4) : (bow === "recurve" ? 3 : 5); }
function winnerArrows(teamSize: TeamSize): readonly Score[] {
  return teamSize === 3 ? ["10", "10", "10", "10", "10", "10"] : ["10", "10", "10"];
}

/** Scores an entire match through Judge UI after moving Admin current_end for each wave. */
export async function scoreJudgeEliminationMatch(page: Page, matchNumber: number, winningSide: 1 | 2, bow: Bow, scope: JudgeMatchScope) {
  const winner = winnerArrows(scope.teamSize);
  const loser = winner.map(() => "9") as readonly Score[];
  if (scope.lastWaveWinnerScores && scope.lastWaveWinnerScores.length !== winner.length) {
    throw new Error("provisional winner arrow count must match event capacity");
  }
  await page.getByRole("button", { name: `Match ${matchNumber}`, exact: false }).click();
  await expect(page.getByTestId("elimination-match-score-comparison")).toBeVisible();
  for (let wave = 1; wave <= waves(bow, scope.teamSize); wave += 1) {
    await test.step(`Judge ${scope.groupName} ${scope.teamSize === 1 ? "個人" : "團體"} ${scope.stage} Match ${matchNumber} 第 ${wave} 波`, async () => {
      await setEliminationProgress(scope.adminPage, scope.competitionId, scope.groupName, scope.teamSize, scope.stage, wave - 1);
      await expect.poll(() => waveCell(page, wave, winningSide).locator("[data-current-end]").getAttribute("data-current-end")).toBe("true");
      await scoreSide(page, wave, winningSide, wave === waves(bow, scope.teamSize) && scope.lastWaveWinnerScores ? scope.lastWaveWinnerScores : winner);
      await scoreSide(page, wave, winningSide === 1 ? 2 : 1, loser);
      await confirmSide(page, wave, 1);
      await confirmSide(page, wave, 2);
    });
  }
  await expect(page.getByTestId(`match-score-side-${winningSide}`).getByText("勝方", { exact: true })).toBeVisible();
}

async function eliminationId(page: Page, competitionId: number, groupName: string, teamSize: number) {
  const response = await page.request.get(`/api/competition/groups/eliminations/${competitionId}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { group_data?: Array<{ group_name?: string; elimination_data?: Array<{ team_size?: number; elimination_id?: number }> }> };
  const id = body.group_data?.find((group) => group.group_name === groupName)?.elimination_data?.find((item) => item.team_size === teamSize)?.elimination_id;
  expect(id, `${groupName} team size ${teamSize} elimination id`).toBeTruthy();
  return id as number;
}

/** Syncs first round through UI, then verifies official GET detail has populated first-stage slots. */
export async function syncFirstRound(page: Page, competitionId: number, groupName: string, teamSize = 1) {
  const id = await eliminationId(page, competitionId, groupName, teamSize);
  await page.goto(`/competition/${competitionId}/admin/progress/elimination/${teamSize}`);
  await selectGroup(page, groupName, competitionId);
  const synced = page.waitForResponse((candidate) => candidate.request().method() === "POST" &&
    new URL(candidate.url()).pathname === `/api/elimination/bracket/${id}/sync-first-round` && candidate.status() === 200);
  await page.getByRole("button", { name: "依隊伍排名更新第一階段", exact: true }).click();
  await synced;
  await expect.poll(async () => {
    const detail = await page.request.get(`/api/elimination/stages/scores/medals/${id}`);
    expect(detail.ok()).toBeTruthy();
    const body = await detail.json() as { stages?: Array<{ matchs?: Array<{ match_results?: Array<{ player_set_id?: number }> }> }> };
    return body.stages?.[0]?.matchs?.flatMap((match) => match.match_results ?? []).every((result) => Boolean(result.player_set_id));
  }).toBe(true);
  return id;
}

/** Product advances immediately; there is no confirmation dialog for this Admin operation. */
export async function advanceStage(page: Page, label: "依結果填入下一階段" | "依結果結算獎牌", stageIndex = 0) {
  const advanced = page.waitForResponse((candidate) => candidate.request().method() === "POST" &&
    /^\/api\/elimination\/stage\/advance\/\d+\/?$/.test(new URL(candidate.url()).pathname) && candidate.status() === 200);
  // The finalisation action is unique.  Non-final stages retain one advance
  // action per source stage, so their explicit stage index remains required.
  await page.getByRole("button", { name: label, exact: true }).nth(label === "依結果結算獎牌" ? 0 : stageIndex).click();
  await advanced;
}

export async function setEliminationProgress(page: Page, competitionId: number, groupName: string, teamSize: TeamSize, stage: "1/4" | "準決賽" | "決賽", end = 0) {
  await page.goto(`/competition/${competitionId}/admin/progress/elimination/${teamSize}`);
  await selectGroup(page, groupName, competitionId);
  const updated = () => page.waitForResponse((candidate) => candidate.request().method() === "PATCH" &&
    /^\/api\/elimination\/progress\/\d+\/?$/.test(new URL(candidate.url()).pathname) && candidate.status() === 200);
  let changed = updated();
  await page.locator('[aria-label="直接選擇強賽"]').getByRole("button", { name: stage, exact: true }).click();
  await changed;
  changed = updated();
  await page.locator('[aria-label="直接選擇波次"]').getByRole("button", { name: `第 ${end + 1} 波`, exact: true }).click();
  await changed;
}
export async function setIndividualProgress(page: Page, competitionId: number, groupName: string, stage: "1/4" | "準決賽" | "決賽", end = 0) {
  await setEliminationProgress(page, competitionId, groupName, 1, stage, end);
}
export async function setTeamProgress(page: Page, competitionId: number, groupName: string, stage: "1/4" | "準決賽" | "決賽", end = 0) {
  await setEliminationProgress(page, competitionId, groupName, 3, stage, end);
}
