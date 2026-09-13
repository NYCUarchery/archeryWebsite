import { expect, test, type Browser, type Page } from "@playwright/test";
import { archers, selectGroup, signedInPage } from "./actors";
import {
  advanceStage,
  chooseJudgeIndividual,
  chooseJudgeTeam,
  scoreJudgeEliminationMatch,
  setTeamProgress,
} from "./elimination";
import { correctConfirmedEliminationEnd } from "./judgeCorrections";
import { assertDivergedEliminationScopes } from "./scopeNavigation";
import { assertPlayerReadsConfirmedCurrentMatch } from "./crossRoleReadback";
import {
  autoSaveTeamRanking,
  createFourTeamBracket,
  createRankedThreePersonTeams,
  placeTeamFirstRoundTargets,
  syncTeamFirstRound,
  type CreatedTeam,
  type TeamBow,
} from "./teams";
import { snapshotIndividualEvent, type IndividualEventSnapshot } from "./verification";

export type TeamGroup = { name: string; bow: TeamBow; firstLane: number };

export type TeamLifecycleOptions = {
  browser: Browser;
  baseURL: string;
  adminPage: Page;
  judgePage: Page;
  visitorPage: Page;
  competitionId: number;
  groupNames: readonly TeamGroup[];
};

type TeamDetail = {
  id: number;
  current_stage: number;
  current_end: number;
  team_size: number;
  player_sets: Array<{
    id: number;
    rank: number;
    set_name: string;
    total_score: number;
    players: Array<{ name: string; rank: number }>;
  }>;
  medals: Array<{ type: number; player_set_id: number }>;
  stages: Array<{
    matchs: Array<{
      match_results: Array<{ player_set_id: number; is_winner: boolean; lane_number: number; target: "A" | "B" | null }>;
    }>;
  }>;
};

function required<T>(value: T | undefined, message: string): T {
  expect(value, message).toBeDefined();
  return value as T;
}

async function activateTeamPhase(page: Page, competitionId: number, phase: "團體對抗賽" | "對抗賽", activateTeam = false) {
  await page.goto(`/competition/${competitionId}/admin/schedule/activation`);
  if (phase === "團體對抗賽" && activateTeam) {
    const activated = page.waitForResponse((candidate) => candidate.request().method() === "PATCH" &&
      new URL(candidate.url()).pathname === `/api/competition/team-elimination-isactive/${competitionId}` && candidate.status() === 200);
    await page.getByRole("group", { name: "開啟賽程" }).getByRole("button", { name: phase, exact: true }).click();
    await activated;
    await expect(page.getByRole("group", { name: "開啟賽程" }).getByRole("button", { name: phase, exact: true })).toBeDisabled();
  }
  const updated = page.waitForResponse((candidate) => candidate.request().method() === "PATCH" &&
    new URL(candidate.url()).pathname === `/api/competition/current-phase/${competitionId}` && candidate.status() === 200);
  await page.getByRole("group", { name: "直接選擇選手畫面" }).getByRole("button", { name: phase, exact: true }).click();
  await updated;
}

async function groupRosters(page: Page, competitionId: number, groups: readonly TeamGroup[]) {
  const response = await page.request.get(`/api/competition/groups/players/${competitionId}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as {
    groups: Array<{ group_name: string; group_index: number; players: Array<{ name: string; rank: number }> }>;
  };
  return new Map(groups.map((group) => {
    const row = required(body.groups.find((item) => item.group_name === group.name), `${group.name} roster`);
    const players = [...row.players].sort((left, right) => left.rank - right.rank);
    expect(players.map((player) => player.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    return [group.name, { names: players.map((player) => player.name), publicIndex: row.group_index }] as const;
  }));
}

async function readTeamDetail(page: Page, eliminationId: number): Promise<TeamDetail> {
  const response = await page.request.get(`/api/elimination/stages/scores/medals/${eliminationId}`);
  expect(response.ok()).toBeTruthy();
  const detail = await response.json() as TeamDetail;
  expect(detail.id).toBe(eliminationId);
  expect(detail.team_size).toBe(3);
  return detail;
}

function assertTeamDetail(detail: TeamDetail, teams: readonly CreatedTeam[]) {
  expect(detail.player_sets).toHaveLength(4);
  const actual = [...detail.player_sets].sort((left, right) => left.rank - right.rank);
  expect(actual.map((team) => ({ name: team.set_name, rank: team.rank, total: team.total_score }))).toEqual(
    teams.map((team, index) => ({ name: team.name, rank: index + 1, total: team.total })),
  );
  for (const [index, team] of teams.entries()) {
    expect(actual[index]?.players.sort((left, right) => left.rank - right.rank).map((player) => player.name)).toEqual(team.players);
  }
  const idByRank = new Map(actual.map((team) => [team.rank, team.id]));
  const rankBySetId = new Map(actual.map((team) => [team.id, team.rank]));
  expect(detail.stages).toHaveLength(2);
  const [semifinals, finals] = detail.stages;
  expect(semifinals?.matchs).toHaveLength(2);
  expect(finals?.matchs).toHaveLength(2);
  const pairIds = (stageIndex: number, matchIndex: number) =>
    detail.stages[stageIndex]?.matchs[matchIndex]?.match_results.map((result) => result.player_set_id);
  const winnerIds = (stageIndex: number, matchIndex: number) =>
    detail.stages[stageIndex]?.matchs[matchIndex]?.match_results.filter((result) => result.is_winner).map((result) => result.player_set_id);
  // Seeded semi-finals are [1,4] and [3,2]. Their winners enter gold as
  // [1,2], while their losers enter bronze as [4,3].
  expect(pairIds(0, 0)).toEqual([idByRank.get(1), idByRank.get(4)]);
  expect(pairIds(0, 1)).toEqual([idByRank.get(3), idByRank.get(2)]);
  expect(winnerIds(0, 0)).toEqual([idByRank.get(1)]);
  expect(winnerIds(0, 1)).toEqual([idByRank.get(2)]);
  expect(pairIds(1, 0)).toEqual([idByRank.get(1), idByRank.get(2)]);
  expect(pairIds(1, 1)).toEqual([idByRank.get(4), idByRank.get(3)]);
  expect(winnerIds(1, 0)).toEqual([idByRank.get(1)]);
  expect(winnerIds(1, 1)).toEqual([idByRank.get(3)]);
  expect(detail.medals).toHaveLength(3);
  expect(new Map(detail.medals.map((medal) => [medal.type, rankBySetId.get(medal.player_set_id)]))).toEqual(new Map([[0, 1], [1, 2], [2, 3]]));
}

function assertUnchangedIndividuals(before: ReadonlyMap<string, IndividualEventSnapshot>, after: ReadonlyMap<string, IndividualEventSnapshot>) {
  for (const [groupName, snapshot] of before) {
    const current = required(after.get(groupName), `${groupName} individual snapshot after team event`);
    expect({ stage: current.currentStage, end: current.currentEnd, medals: [...current.medals] }).toEqual({
      stage: snapshot.currentStage,
      end: snapshot.currentEnd,
      medals: [...snapshot.medals],
    });
  }
}

async function assertJudgeScopeSwitching(adminPage: Page, page: Page, competitionId: number, groups: readonly TeamGroup[], individualIds: ReadonlyMap<string, number>, teamIds: ReadonlyMap<string, number>, teamsByGroup: ReadonlyMap<string, readonly CreatedTeam[]>) {
  const first = required(groups[0], "first group");
  const second = required(groups[1], "second group");
  const individualID = required(individualIds.get(first.name), "individual ID");
  const teamID = required(teamIds.get(first.name), "team ID");
  const beforeIndividual = await readProgress(adminPage, individualID);
  const beforeTeam = await readProgress(adminPage, teamID);
  await adminPage.goto(`/competition/${competitionId}/admin/progress/elimination/1`);
  // MUI Tabs places aria-label on its inner tablist, not on the outer root
  // whose custom role is navigation.
  const adminNavigation = adminPage.getByRole("tablist", { name: "schedule panel" });
  // These Tabs are the actual Admin event navigation; exercise its state
  // transitions before validating the team route's A → B → A group menu.
  await adminNavigation.getByRole("tab", { name: "團體對抗賽", exact: true }).click();
  await expect(adminPage).toHaveURL(new RegExp(`/competition/${competitionId}/admin/progress/elimination/3$`));
  await adminNavigation.getByRole("tab", { name: "個人對抗賽", exact: true }).click();
  await expect(adminPage).toHaveURL(new RegExp(`/competition/${competitionId}/admin/progress/elimination/1$`));
  await adminNavigation.getByRole("tab", { name: "團體對抗賽", exact: true }).click();
  await expect(adminPage).toHaveURL(new RegExp(`/competition/${competitionId}/admin/progress/elimination/3$`));
  await selectGroup(adminPage, first.name, competitionId);
  await selectGroup(adminPage, second.name, competitionId);
  await selectGroup(adminPage, first.name, competitionId);
  await page.goto(`/competition/${competitionId}/judge`);
  const judgeGroup = page.getByRole("combobox", { name: "組別", exact: true });
  const judgeEvent = page.getByRole("combobox", { name: "項目", exact: true });
  await chooseJudgeIndividual(page, first.name);
  await expect(judgeGroup).toContainText(first.name);
  await expect(judgeEvent).toContainText("個人對抗賽");
  await expect(page.getByTestId("elimination-match-score-comparison")).toHaveCount(0);
  await chooseJudgeTeam(page, first.name);
  await expect(judgeGroup).toContainText(first.name);
  await expect(judgeEvent).toContainText("團體對抗賽");
  await expect(page.getByTestId("elimination-match-score-comparison")).toHaveCount(0);
  const firstTeams = required(teamsByGroup.get(first.name), `${first.name} teams`);
  await page.getByRole("button", { name: "Match 1", exact: false }).click();
  const comparison = page.getByTestId("elimination-match-score-comparison");
  await expect(comparison.getByTestId("match-score-side-1").getByText(firstTeams[0]!.name, { exact: true })).toBeVisible();
  await expect(comparison.getByTestId("match-score-side-2").getByText(firstTeams[3]!.name, { exact: true })).toBeVisible();
  await expect(page.getByTestId("match-score-end-1-side-1").getByLabel("未記分")).toHaveCount(6);
  await chooseJudgeTeam(page, second.name);
  await expect(judgeGroup).toContainText(second.name);
  await expect(judgeEvent).toContainText("團體對抗賽");
  await expect(page.getByTestId("elimination-match-score-comparison")).toHaveCount(0);
  await chooseJudgeTeam(page, first.name);
  await expect(judgeGroup).toContainText(first.name);
  await expect(judgeEvent).toContainText("團體對抗賽");
  await expect(page.getByTestId("elimination-match-score-comparison")).toHaveCount(0);
  await chooseJudgeIndividual(page, first.name);
  await expect(judgeGroup).toContainText(first.name);
  await expect(judgeEvent).toContainText("個人對抗賽");
  await expect(page.getByTestId("elimination-match-score-comparison")).toHaveCount(0);
  const individual = await page.request.get(`/api/elimination/stages/scores/medals/${individualID}`);
  const team = await page.request.get(`/api/elimination/stages/scores/medals/${teamID}`);
  expect(individual.ok()).toBeTruthy();
  expect(team.ok()).toBeTruthy();
  expect((await individual.json() as { team_size: number }).team_size).toBe(1);
  expect((await team.json() as { team_size: number }).team_size).toBe(3);
  expect(await readProgress(adminPage, individualID)).toEqual(beforeIndividual);
  expect(await readProgress(adminPage, teamID)).toEqual(beforeTeam);
}

async function readProgress(page: Page, eliminationId: number) {
  const response = await page.request.get(`/api/elimination/stages/scores/medals/${eliminationId}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as { id: number; team_size: number; current_stage: number; current_end: number; medals: Array<{ type: number; player_set_id: number }> };
  return { id: body.id, teamSize: body.team_size, stage: body.current_stage, end: body.current_end, medals: body.medals };
}

async function snapshotIndividualIntegrity(page: Page, competitionId: number, groups: readonly TeamGroup[], ids: ReadonlyMap<string, number>) {
  const rosterResponse = await page.request.get(`/api/competition/groups/players/${competitionId}`);
  expect(rosterResponse.ok()).toBeTruthy();
  const roster = await rosterResponse.json() as { groups: Array<{ group_name: string; players: Array<{ id: number; rank: number; total_score: number }> }> };
  const result = new Map<string, unknown>();
  for (const group of groups) {
    const players = required(roster.groups.find((item) => item.group_name === group.name), `${group.name} qualification snapshot`).players;
    const detailResponse = await page.request.get(`/api/elimination/stages/scores/medals/${required(ids.get(group.name), `${group.name} individual ID`)}`);
    expect(detailResponse.ok()).toBeTruthy();
    result.set(group.name, {
      qualification: [...players].sort((left, right) => left.rank - right.rank).map((player) => ({ id: player.id, rank: player.rank, total: player.total_score })),
      elimination: await detailResponse.json(),
    });
  }
  return result;
}

/**
 * Extends the same competition through both team events. Every mutation is an Admin/Judge/Player
 * UI action; GET calls only identify or verify resources.
 */
export async function completeTeamLifecycle(options: TeamLifecycleOptions) {
  const { browser, baseURL, adminPage, judgePage, visitorPage, competitionId, groupNames } = options;
  expect(groupNames).toHaveLength(2);
  const rosters = await groupRosters(adminPage, competitionId, groupNames);
  const individualBefore = new Map<string, IndividualEventSnapshot>();
  const individualIds = new Map<string, number>();
  for (const group of groupNames) {
    const snapshot = await snapshotIndividualEvent(adminPage.request, competitionId, group.name);
    individualBefore.set(group.name, snapshot);
    individualIds.set(group.name, snapshot.eliminationId);
  }

  const individualIntegrityBefore = await snapshotIndividualIntegrity(adminPage, competitionId, groupNames, individualIds);

  await activateTeamPhase(adminPage, competitionId, "團體對抗賽", true);
  const teamsByGroup = new Map<string, readonly CreatedTeam[]>();
  const teamIds = new Map<string, number>();
  for (const group of groupNames) {
    await test.step(`${group.name} 團體建隊、排名、建表與靶位`, async () => {
      const roster = required(rosters.get(group.name), `${group.name} team roster`);
      const teams = await createRankedThreePersonTeams(adminPage, competitionId, group.name, group.bow, roster.names);
      await autoSaveTeamRanking(adminPage, teams);
      const eliminationId = required(teams[0]?.eliminationId, `${group.name} team elimination ID`);
      await createFourTeamBracket(adminPage, competitionId, group.name, eliminationId);
      await syncTeamFirstRound(adminPage, competitionId, group.name, eliminationId, teams);
      await placeTeamFirstRoundTargets(adminPage, eliminationId, teams, group.firstLane, group.firstLane + 1);
      teamsByGroup.set(group.name, teams);
      teamIds.set(group.name, eliminationId);
    });
  }

  // Real group/event menus must return to their original A scope without
  // mixing team-size 1 and 3 resources.
  await assertJudgeScopeSwitching(adminPage, judgePage, competitionId, groupNames, individualIds, teamIds, teamsByGroup);
  await activateTeamPhase(adminPage, competitionId, "團體對抗賽");

  const archer01 = await signedInPage(browser, baseURL, archers[0]);
  const archer09 = await signedInPage(browser, baseURL, archers[8]);
  try {
    const firstGroup = required(groupNames[0], "first team group");
    const firstTeam = required(teamsByGroup.get(firstGroup.name)?.[0], "first team");
    const firstOpponent = required(teamsByGroup.get(firstGroup.name)?.[3], "first team opponent");
    await Promise.all([archer01.page.goto(`/competition/${competitionId}/scoring`), archer09.page.goto(`/competition/${competitionId}/scoring`)]);
    const selectedMatchResultIds = await Promise.all([archer01.page, archer09.page].map((playerPage) =>
      assertTeamMemberScoringView(playerPage, firstTeam, firstOpponent),
    ));
    // Archer 01 and Archer 09 are in the same [1,5,9] team. Both must select
    // the same MatchResult rather than merely seeing a similarly named match.
    expect(selectedMatchResultIds[0]).toBe(selectedMatchResultIds[1]);
    await activateTeamPhase(adminPage, competitionId, "對抗賽");
    await archer09.page.goto(`/competition/${competitionId}/scoring`);
    await expect(archer09.page.getByText("您尚未被編入對抗賽的隊伍。", { exact: true })).toBeVisible();
    await activateTeamPhase(adminPage, competitionId, "團體對抗賽");
    await archer09.page.goto(`/competition/${competitionId}/scoring`);
    await assertTeamMemberScoringView(archer09.page, firstTeam, firstOpponent);
  } finally {
    await Promise.all([archer01.context.close(), archer09.context.close()]);
  }

  const rounds = [[1, 2], [1, 2]] as const;
  const firstGroup = required(groupNames[0], "first team group");
  const secondGroup = required(groupNames[1], "second team group");
  const firstTeamBefore = await readProgress(adminPage, required(teamIds.get(firstGroup.name), `${firstGroup.name} team ID`));
  const secondTeamBefore = await readProgress(adminPage, required(teamIds.get(secondGroup.name), `${secondGroup.name} team ID`));
  for (const group of groupNames) {
    for (const [stageIndex, winners] of rounds.entries()) {
      const stage = stageIndex === 0 ? "準決賽" : "決賽";
      for (const [matchIndex, side] of winners.entries()) {
        await test.step(`${group.name} 團體 ${stage} Match ${matchIndex + 1}`, async () => {
          await setTeamProgress(adminPage, competitionId, group.name, stage);
          await judgePage.goto(`/competition/${competitionId}/judge`);
          await chooseJudgeTeam(judgePage, group.name);
          await scoreJudgeEliminationMatch(judgePage, matchIndex + 1, side, group.bow, {
            adminPage,
            competitionId,
            groupName: group.name,
            teamSize: 3,
            stage,
            lastWaveWinnerScores: group.name === firstGroup.name && stageIndex === 0 && matchIndex === 0
              ? ["10", "10", "10", "10", "10", "9"] : undefined,
          });
          if (group.name === firstGroup.name && stageIndex === 0 && matchIndex === 0) {
            const eliminationId = required(teamIds.get(group.name), `${group.name} team ID`);
            await correctConfirmedEliminationEnd(judgePage, {
              eliminationId, wave: 3, side,
              provisional: ["10", "10", "10", "10", "10", "9"],
              expected: ["10", "10", "10", "10", "10", "10"],
              expectedPoints: 2, expectedCumulativePoints: 6,
            });
            const archer09 = await signedInPage(browser, baseURL, archers[8]);
            try {
              const teams = required(teamsByGroup.get(group.name), `${group.name} teams`);
              await assertPlayerReadsConfirmedCurrentMatch(archer09.page, {
                competitionId, eliminationId, winnerTeam: teams[0]!.name,
                loserTeam: teams[3]!.name, teamSize: 3,
              });
            } finally {
              await archer09.context.close();
            }
          }
        });
      }
      await adminPage.goto(`/competition/${competitionId}/admin/progress/elimination/3`);
      await selectGroup(adminPage, group.name, competitionId);
      const label = stageIndex === 0 ? "依結果填入下一階段" : "依結果結算獎牌";
      await advanceStage(adminPage, label, stageIndex);
    }
    assertTeamDetail(await readTeamDetail(adminPage, required(teamIds.get(group.name), `${group.name} team ID`)), required(teamsByGroup.get(group.name), `${group.name} teams`));
    const publicGroup = required(rosters.get(group.name), `${group.name} public index`);
    await visitorPage.goto(`/competition/${competitionId}/scoreboard/${publicGroup.publicIndex}/elimination/3`);
    const publicTeam = required(teamsByGroup.get(group.name)?.[0], "public first team");
    await expect(visitorPage.locator("svg").getByText(`No.1 ${publicTeam.name}`, { exact: true }).first()).toBeVisible();
    const otherGroup = required(groupNames.find((candidate) => candidate.name !== group.name), `${group.name} opposing group`);
    const opposingTeam = required(teamsByGroup.get(otherGroup.name)?.[0], "public opposing team");
    await expect(visitorPage.locator("svg").getByText(`No.1 ${opposingTeam.name}`, { exact: true })).toHaveCount(0);
    if (group.name === firstGroup.name) {
      const firstTeamAfter = await readProgress(adminPage, required(teamIds.get(firstGroup.name), `${firstGroup.name} team ID`));
      const secondTeamAfter = await readProgress(adminPage, required(teamIds.get(secondGroup.name), `${secondGroup.name} team ID`));
      expect(firstTeamAfter.stage).toBe(1);
      expect(firstTeamAfter.end).toBe(firstGroup.bow === "recurve" ? 2 : 3);
      expect(firstTeamAfter.medals).not.toEqual(firstTeamBefore.medals);
      expect(secondTeamAfter).toEqual(secondTeamBefore);
      await assertDivergedEliminationScopes(adminPage, judgePage, competitionId, 3,
        { groupName: firstGroup.name, stage: 1, end: firstGroup.bow === "recurve" ? 2 : 3, stageLabel: "決賽", setName: required(teamsByGroup.get(firstGroup.name), "first teams")[0]!.name },
        { groupName: secondGroup.name, stage: 0, end: 0, stageLabel: "準決賽", setName: required(teamsByGroup.get(secondGroup.name), "second teams")[0]!.name },
      );
    }
  }

  const individualAfter = new Map<string, IndividualEventSnapshot>();
  for (const group of groupNames) individualAfter.set(group.name, await snapshotIndividualEvent(adminPage.request, competitionId, group.name));
  assertUnchangedIndividuals(individualBefore, individualAfter);
  expect(await snapshotIndividualIntegrity(adminPage, competitionId, groupNames, individualIds)).toEqual(individualIntegrityBefore);
}

/** Player scoring has MatchResultSelector buttons, not the Judge comparison dialog. */
async function assertTeamMemberScoringView(page: Page, firstTeam: CreatedTeam, firstOpponent: CreatedTeam) {
  const board = page.locator(".elimination_board");
  await expect(board).toBeVisible();
  const sides = board.locator(".match_result_button_group .match_result_button");
  await expect(sides).toHaveCount(2);
  const mine = sides.filter({ has: page.locator(".name_bar", { hasText: firstTeam.name }) });
  const opponent = sides.filter({ has: page.locator(".name_bar", { hasText: firstOpponent.name }) });
  await expect(mine).toHaveCount(1);
  await expect(opponent).toHaveCount(1);
  await expect(mine.locator(".name_bar")).toHaveText(firstTeam.name);
  await expect(opponent.locator(".name_bar")).toHaveText(firstOpponent.name);
  await expect(mine.getByText(firstTeam.players.join("、"), { exact: true })).toBeVisible();
  await expect(opponent.getByText(firstOpponent.players.join("、"), { exact: true })).toBeVisible();
  await expect(mine.locator(".score_block")).toHaveCount(6);
  await expect(opponent.locator(".score_block")).toHaveCount(6);
  await expect(mine).toHaveAttribute("aria-pressed", "true");
  const matchResultId = await mine.getAttribute("value");
  expect(matchResultId, "selected team MatchResult ID").toMatch(/^\d+$/);
  return matchResultId!;
}
