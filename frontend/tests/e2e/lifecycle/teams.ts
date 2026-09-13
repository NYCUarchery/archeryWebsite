import { expect, type Page } from "@playwright/test";
import { selectGroup } from "./actors";

export type TeamBow = "recurve" | "compound";
export type TeamPlan = {
  name: string;
  ranks: readonly [number, number, number];
  players: readonly [string, string, string];
  total: number;
};

export type CreatedTeam = TeamPlan & { id: number; eliminationId: number };

type BracketResult = { player_set_id?: number; lane_number?: number; target?: "A" | "B" | null };
type BracketDetail = { stages?: Array<{ matchs?: Array<{ match_results?: BracketResult[] }> }> };

const rosterRanks = [
  [1, 5, 9],
  [2, 6, 10],
  [3, 7, 11],
  [4, 8, 12],
] as const;

// Literal E2E outcomes for [1,5,9], [2,6,10], [3,7,11], [4,8,12]. Keep
// them independent from the qualification data and from product calculations.
const teamTotals: Record<TeamBow, readonly [number, number, number, number]> = {
  recurve: [1068, 1065, 1062, 1059],
  compound: [1032, 1029, 1026, 1023],
};

export function rankedTeamPlans(
  groupName: string,
  bow: TeamBow,
  playersByQualificationRank: readonly string[],
): readonly TeamPlan[] {
  if (playersByQualificationRank.length !== 12) {
    throw new Error(`${groupName} 團體建隊需要恰好 12 名已排序選手`);
  }
  return rosterRanks.map((ranks, index) => ({
    name: `${groupName} 團體 ${index + 1}`,
    ranks,
    players: ranks.map((rank) => playersByQualificationRank[rank - 1]) as TeamPlan["players"],
    total: teamTotals[bow][index],
  }));
}

function escaped(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function createManualTeam(page: Page, plan: TeamPlan): Promise<CreatedTeam> {
  const selectors = page.getByLabel("選手姓名");
  await expect(selectors).toHaveCount(3);
  for (const [index, player] of plan.players.entries()) {
    await selectors.nth(index).fill(player);
    await page.getByRole("option", {
      name: new RegExp(`^${escaped(player)} rank: ${plan.ranks[index]}$`),
    }).click();
  }

  // MUI Autocomplete inputs expose combobox, not textbox. The sole textbox is
  // the unlabelled team-name TextField following those three comboboxes.
  const textboxes = page.getByRole("textbox");
  await expect(textboxes).toHaveCount(1);
  await textboxes.fill(plan.name);
  const created = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "POST" && /^\/api\/playerset\/?$/.test(path) && candidate.status() === 200;
  });
  await page.getByRole("button", { name: "創建隊伍", exact: true }).click();
  const body = await (await created).json() as { id?: number; elimination_id?: number };
  expect(body.id, `${plan.name} 建立 response 必須有隊伍 id`).toBeTruthy();
  expect(body.elimination_id, `${plan.name} 建立 response 必須有 elimination id`).toBeTruthy();
  return { ...plan, id: body.id as number, eliminationId: body.elimination_id as number };
}

async function teamBracketDetail(page: Page, eliminationId: number) {
  const response = await page.request.get(`/api/elimination/stages/scores/medals/${eliminationId}`);
  expect(response.ok(), "team bracket official detail").toBeTruthy();
  return await response.json() as BracketDetail;
}

function firstRound(detail: BracketDetail) {
  const matches = detail.stages?.[0]?.matchs;
  expect(matches, "four-team first stage").toHaveLength(2);
  for (const match of matches ?? []) expect(match.match_results, "first-round sides").toHaveLength(2);
  return matches!;
}

function expectedFirstRoundIds(teams: readonly CreatedTeam[]) {
  expect(teams).toHaveLength(4);
  return [[teams[0]!.id, teams[3]!.id], [teams[2]!.id, teams[1]!.id]];
}

function assertFirstRoundSlots(detail: BracketDetail, teams: readonly CreatedTeam[]) {
  expect(firstRound(detail).map((match) => match.match_results?.map((result) => result.player_set_id))).toEqual(expectedFirstRoundIds(teams));
}

/** Builds four disjoint three-person teams as the Admin through the schedule UI. */
export async function createRankedThreePersonTeams(
  page: Page,
  competitionId: number,
  groupName: string,
  bow: TeamBow,
  playersByQualificationRank: readonly string[],
): Promise<readonly CreatedTeam[]> {
  const plans = rankedTeamPlans(groupName, bow, playersByQualificationRank);
  await page.goto(`/competition/${competitionId}/admin/schedule/elimination/3`);
  await selectGroup(page, groupName, competitionId);
  const teams: CreatedTeam[] = [];
  for (const plan of plans) {
    const team = await createManualTeam(page, plan);
    const detail = await page.request.get(`/api/playerset/${team.id}`);
    expect(detail.ok(), `${plan.name} GET detail`).toBeTruthy();
    const body = await detail.json() as { players?: Array<{ name?: string; rank?: number; total_score?: number }> };
    const members = [...(body.players ?? [])].sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0));
    expect(members.map((player) => player.name)).toEqual(plan.players);
    expect(members.map((player) => player.rank)).toEqual(plan.ranks);
    teams.push(team);
  }
  expect(new Set(teams.flatMap((team) => team.players)).size).toBe(12);
  expect(new Set(teams.map((team) => team.eliminationId)).size).toBe(1);
  return teams;
}

/** The UI's automatic-ranking command persists ranks; no manual draft exists to save afterwards. */
export async function autoSaveTeamRanking(page: Page, teams: readonly CreatedTeam[]) {
  const eliminationId = teams[0]?.eliminationId;
  if (!eliminationId) throw new Error("缺少團體 elimination id");
  const saved = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PATCH" &&
      path === `/api/playerset/elimination/${eliminationId}/ranking/auto` && candidate.status() === 200;
  });
  await page.getByRole("button", { name: "自動更新排名", exact: true }).click();
  await saved;
  await expect.poll(async () => {
    const response = await page.request.get(`/api/playerset/elimination/${eliminationId}/ranking`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json() as { player_sets?: Array<{ id?: number; rank?: number; total_score?: number }> };
    return body.player_sets?.map((team) => ({ id: team.id, rank: team.rank, total: team.total_score }));
  }).toEqual(teams.map((team, index) => ({ id: team.id, rank: index + 1, total: team.total })));
}

export async function createFourTeamBracket(page: Page, competitionId: number, groupName: string, eliminationId: number) {
  await page.goto(`/competition/${competitionId}/admin/schedule/elimination/3`);
  await selectGroup(page, groupName, competitionId);
  await page.getByRole("button", { name: "建立完整對抗樹", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "建立完整對抗樹" });
  await dialog.getByLabel("晉級數").fill("4");
  const created = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "POST" &&
      path === `/api/elimination/bracket/${eliminationId}` && candidate.status() === 200;
  });
  await dialog.getByRole("button", { name: "建立", exact: true }).click();
  await created;
  await expect(dialog).toBeHidden();
  // Bracket creation must not quietly apply rankings; explicit first-round
  // synchronisation below is the only writer of these four slots.
  expect(firstRound(await teamBracketDetail(page, eliminationId)).map((match) =>
    match.match_results?.map((result) => result.player_set_id),
  )).toEqual([[undefined, undefined], [undefined, undefined]]);
}

export async function syncTeamFirstRound(page: Page, competitionId: number, groupName: string, eliminationId: number, teams: readonly CreatedTeam[]) {
  await page.goto(`/competition/${competitionId}/admin/progress/elimination/3`);
  await selectGroup(page, groupName, competitionId);
  const synced = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "POST" &&
      path === `/api/elimination/bracket/${eliminationId}/sync-first-round` && candidate.status() === 200;
  });
  await page.getByRole("button", { name: "依隊伍排名更新第一階段", exact: true }).click();
  await synced;
  assertFirstRoundSlots(await teamBracketDetail(page, eliminationId), teams);
}

/** Configures the first team stage's targets using its explicit Admin dialog. */
export async function placeTeamFirstRoundTargets(
  page: Page,
  eliminationId: number,
  teams: readonly CreatedTeam[],
  startLane: number,
  endLane: number,
) {
  await page.getByRole("button", { name: "設定本階段靶道", exact: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "設定本階段靶道" });
  await dialog.getByLabel("起始靶道").fill(String(startLane));
  await dialog.getByLabel("結束靶道").fill(String(endLane));
  await dialog.getByRole("combobox").click();
  await page.getByRole("option", { name: "每靶道兩隊（靶面 A/B）", exact: true }).click();
  const saved = page.waitForResponse((candidate) => {
    const path = new URL(candidate.url()).pathname;
    return candidate.request().method() === "PUT" && /^\/api\/elimination\/stage\/placement\/\d+\/?$/.test(path) && candidate.status() === 200;
  });
  await dialog.getByRole("button", { name: "套用", exact: true }).click();
  await saved;
  await expect(dialog).toBeHidden();
  const detail = await teamBracketDetail(page, eliminationId);
  const matches = firstRound(detail);
  assertFirstRoundSlots(detail, teams);
  expect(matches.map((match) => match.match_results?.map((result) => ({ lane: result.lane_number, target: result.target })))).toEqual([
    [{ lane: startLane, target: "A" }, { lane: startLane, target: "B" }],
    [{ lane: startLane + 1, target: "A" }, { lane: startLane + 1, target: "B" }],
  ]);
}
