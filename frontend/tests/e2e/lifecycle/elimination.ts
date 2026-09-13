import { expect, test, type Page } from "@playwright/test";
import { selectGroup } from "./actors";
import { eliminationWriteActor, type LifecycleExecutionMode } from "./execution";
import { readMatchEnd, resolveCurrentMatchEnd, writeMatchEnd, type MatchEndRef, type ScopedActor } from "./formalApi";

type Bow = "recurve" | "compound";
type TeamSize = 1 | 3;
type Score = "10" | "9";
type JudgeMatchScope = {
  adminPage: Page; competitionId: number; groupName: string; teamSize: TeamSize; stage: "1/4" | "準決賽" | "決賽";
  /** Literal provisional final-wave winner arrows, corrected before advancement. */
  lastWaveWinnerScores?: readonly Score[];
  mode?: LifecycleExecutionMode;
  apiActor?: Omit<ScopedActor, "groupName">;
  recordApiSide?: () => void;
  recordUiSide?: () => void;
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
async function scoreSide(page: Page, wave: number, side: 1 | 2, scores: readonly Score[], expected?: MatchEndRef) {
  const cell = waveCell(page, wave, side);
  await cell.getByRole("button", { name: "編輯本波分數" }).click();
  const dialog = page.getByRole("dialog", { name: `編輯第 ${wave} 波` });
  await expect(dialog).toBeVisible();
  for (const score of scores) await dialog.getByRole("button", { name: score, exact: true }).click();
  const saved = page.waitForResponse((candidate) => candidate.request().method() === "PATCH" &&
    /^\/api\/matchresult\/matchend\/scores\/\d+\/?$/.test(new URL(candidate.url()).pathname) && candidate.status() === 200);
  await dialog.getByRole("button", { name: "送出", exact: true }).click();
  const response = await saved;
  if (expected) {
    expect(new URL(response.url()).pathname).toBe(`/api/matchresult/matchend/scores/${expected.endId}`);
    expect(response.request().postDataJSON()).toEqual({ match_score_ids: expected.scoreIds, scores: scores.map(Number), total_scores: total(scores) });
  }
  await expect(dialog).toBeHidden();
  await expect.poll(() => cell.locator(".score_block").allTextContents()).toEqual([...scores]);
  await expect(cell.getByLabel(`箭分總分：${total(scores)}`)).toBeVisible();
}
async function confirmSide(page: Page, wave: number, side: 1 | 2, expected?: MatchEndRef) {
  const cell = waveCell(page, wave, side);
  const confirmed = page.waitForResponse((candidate) => candidate.request().method() === "PATCH" &&
    /^\/api\/matchresult\/matchend\/isconfirmed\/\d+\/?$/.test(new URL(candidate.url()).pathname) && candidate.status() === 200);
  await cell.getByRole("button", { name: "切換為已確認", exact: true }).click();
  const response = await confirmed;
  if (expected) {
    expect(new URL(response.url()).pathname).toBe(`/api/matchresult/matchend/isconfirmed/${expected.endId}`);
    expect(response.request().postDataJSON()).toEqual({ is_confirmed: true });
  }
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
  const mode = scope.mode ?? "full-ui";
  const stageIndex = scope.teamSize === 3
    ? (scope.stage === "準決賽" ? 0 : 1)
    : (scope.stage === "1/4" ? 0 : scope.stage === "準決賽" ? 1 : 2);
  const usesUi = (wave: number) => mode === "full-ui" || eliminationWriteActor({ bow, teamSize: scope.teamSize, stageIndex, matchIndex: matchNumber - 1, waveIndex: wave - 1 }) === "ui";
  if (Array.from({ length: waves(bow, scope.teamSize) }, (_, index) => usesUi(index + 1)).some(Boolean)) {
    await page.getByRole("button", { name: `Match ${matchNumber}`, exact: false }).click();
    await expect(page.getByTestId("elimination-match-score-comparison")).toBeVisible();
  }
  for (let wave = 1; wave <= waves(bow, scope.teamSize); wave += 1) {
    await test.step(`${usesUi(wave) ? "Judge UI" : "Judge API"} ${scope.groupName} ${scope.teamSize === 1 ? "個人" : "團體"} ${scope.stage} Match ${matchNumber} 第 ${wave} 波`, async () => {
      await setEliminationProgress(scope.adminPage, scope.competitionId, scope.groupName, scope.teamSize, scope.stage, wave - 1);
      const winnerScores = wave === waves(bow, scope.teamSize) && scope.lastWaveWinnerScores ? scope.lastWaveWinnerScores : winner;
      if (usesUi(wave)) {
        await expect.poll(() => waveCell(page, wave, winningSide).locator("[data-current-end]").getAttribute("data-current-end")).toBe("true");
        const actor = scope.apiActor;
        if (!actor) throw new Error("elimination UI response verification requires the Judge actor");
        const winnerRef = await resolveCurrentMatchEnd(page.request, { ...actor, groupName: scope.groupName }, { teamSize: scope.teamSize, matchIndex: matchNumber - 1, side: winningSide });
        const loserSide = winningSide === 1 ? 2 : 1;
        const loserRef = await resolveCurrentMatchEnd(page.request, { ...actor, groupName: scope.groupName }, { teamSize: scope.teamSize, matchIndex: matchNumber - 1, side: loserSide });
        for (const ref of [winnerRef, loserRef]) {
          if (ref.stageIndex !== stageIndex || ref.currentEnd !== wave - 1) throw new Error(`UI match scope resolved stage/end ${ref.stageIndex}/${ref.currentEnd}, expected ${stageIndex}/${wave - 1}`);
        }
        await scoreSide(page, wave, winningSide, winnerScores, winnerRef);
        await scoreSide(page, wave, loserSide, loser, loserRef);
        await confirmSide(page, wave, 1, winningSide === 1 ? winnerRef : loserRef);
        await confirmSide(page, wave, 2, winningSide === 2 ? winnerRef : loserRef);
        await readMatchEnd(page.request, winnerRef, winnerScores.map(Number));
        await readMatchEnd(page.request, loserRef, loser.map(Number));
        scope.recordUiSide?.(); scope.recordUiSide?.();
      } else {
        const actor = scope.apiActor;
        if (!actor) throw new Error("hybrid elimination API scoring requires a Judge actor");
        for (const [side, scores] of [[winningSide, winnerScores], [winningSide === 1 ? 2 : 1, loser]] as const) {
          const ref = await resolveCurrentMatchEnd(page.request, { ...actor, groupName: scope.groupName }, { teamSize: scope.teamSize, matchIndex: matchNumber - 1, side });
          if (ref.stageIndex !== stageIndex || ref.currentEnd !== wave - 1) throw new Error(`API match scope resolved stage/end ${ref.stageIndex}/${ref.currentEnd}, expected ${stageIndex}/${wave - 1}`);
          await writeMatchEnd(mode, page.request, { ...actor, groupName: scope.groupName }, ref, scores.map(Number));
          scope.recordApiSide?.();
        }
      }
    });
  }
  if (usesUi(waves(bow, scope.teamSize))) await expect(page.getByTestId(`match-score-side-${winningSide}`).getByText("勝方", { exact: true })).toBeVisible();
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
