import { expect, type APIRequestContext } from "@playwright/test";

/**
 * Read model of GET /elimination/stages/scores/medals/:id.  Match results do
 * not preload player_set; resolve every result through player_set_id against
 * elimination.player_sets, exactly as the backend response contract requires.
 */
type IndividualEliminationDetail = {
  id: number;
  current_stage: number;
  current_end: number;
  team_size: number;
  player_sets: Array<{
    id: number;
    rank: number;
    players: Array<{ id: number; participant_id: number }>;
  }>;
  stages: Array<{
    id: number;
    matchs: Array<{
      id: number;
      match_results: Array<{ id: number; player_set_id?: number; is_winner: boolean }>;
    }>;
  }>;
  medals: Array<{ type: number; player_set_id: number }>;
};

export type IndividualEventSnapshot = {
  eliminationId: number;
  currentStage: number;
  currentEnd: number;
  medals: ReadonlyMap<number, number>;
};

export type IndividualSeedIdentities = {
  playerSetIdByRank: ReadonlyMap<number, number>;
  participantIdByRank: ReadonlyMap<number, number>;
};

const individualSeedOrder = [1, 8, 5, 4, 3, 6, 7, 2] as const;
const quarterfinalWinners = [1, 4, 3, 2] as const;
const semifinalPairs = [[1, 4], [3, 2]] as const;
const semifinalWinners = [1, 2] as const;
const finalPairs = [[1, 2], [4, 3]] as const;
const medalRanksByType = new Map([[0, 1], [1, 2], [2, 3]]);

function required<T>(value: T | null | undefined, message: string): T {
  expect(value, message).not.toBeNull();
  expect(value, message).not.toBeUndefined();
  return value as T;
}

/** Officially resolves an event ID rather than retaining a browser-derived ID. */
export async function resolveIndividualEliminationId(
  request: APIRequestContext,
  competitionId: number,
  groupName: string,
): Promise<number> {
  const response = await request.get(`/api/competition/groups/eliminations/${competitionId}`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json() as {
    group_data: Array<{
      group_name: string;
      elimination_data: Array<{ elimination_id: number; team_size: number }>;
    }>;
  };
  const group = required(data.group_data.find((item) => item.group_name === groupName), `${groupName} elimination group`);
  return required(group.elimination_data.find((item) => item.team_size === 1)?.elimination_id, `${groupName} individual elimination ID`);
}

async function readIndividualDetail(request: APIRequestContext, eliminationId: number): Promise<IndividualEliminationDetail> {
  const response = await request.get(`/api/elimination/stages/scores/medals/${eliminationId}`);
  expect(response.ok()).toBeTruthy();
  const detail = await response.json() as IndividualEliminationDetail;
  expect(detail.id).toBe(eliminationId);
  expect(detail.team_size).toBe(1);
  return detail;
}

/**
 * Maps literal qualification ranks to the generated PlayerSet and Participant
 * IDs. Individual sets must contain exactly one real participant; ranks 9–12
 * cannot leak into this eight-set bracket.
 */
export function resolveIndividualSeedIdentities(detail: IndividualEliminationDetail): IndividualSeedIdentities {
  expect(detail.player_sets).toHaveLength(8);
  expect(detail.player_sets.map((set) => set.rank).sort((left, right) => left - right)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

  const playerSetIdByRank = new Map<number, number>();
  const participantIdByRank = new Map<number, number>();
  for (const set of detail.player_sets) {
    expect(set.players, `rank ${set.rank} must be an individual set`).toHaveLength(1);
    playerSetIdByRank.set(set.rank, set.id);
    participantIdByRank.set(set.rank, required(set.players[0]?.participant_id, `rank ${set.rank} participant ID`));
  }
  return { playerSetIdByRank, participantIdByRank };
}

function ranksForMatch(
  match: IndividualEliminationDetail["stages"][number]["matchs"][number],
  playerSetIdByRank: ReadonlyMap<number, number>,
): number[] {
  expect(match.match_results, `match ${match.id} must have two sides`).toHaveLength(2);
  const rankByPlayerSetId = new Map([...playerSetIdByRank].map(([rank, id]) => [id, rank]));
  return match.match_results.map((result) =>
    required(rankByPlayerSetId.get(required(result.player_set_id, `match ${match.id} player set`)), `match ${match.id} uses an out-of-bracket player set`),
  );
}

function winnerRank(
  match: IndividualEliminationDetail["stages"][number]["matchs"][number],
  playerSetIdByRank: ReadonlyMap<number, number>,
): number {
  const winners = match.match_results.filter((result) => result.is_winner);
  expect(winners, `match ${match.id} must have one winner`).toHaveLength(1);
  const rankByPlayerSetId = new Map([...playerSetIdByRank].map(([rank, id]) => [id, rank]));
  return required(rankByPlayerSetId.get(required(winners[0]?.player_set_id, `match ${match.id} winner player set`)), `match ${match.id} winner is out of bracket`);
}

function assertStage(
  detail: IndividualEliminationDetail,
  stageIndex: number,
  expectedPairs: readonly (readonly [number, number])[],
  expectedWinners: readonly number[],
  playerSetIdByRank: ReadonlyMap<number, number>,
) {
  const stage = required(detail.stages[stageIndex], `stage ${stageIndex}`);
  expect(stage.matchs).toHaveLength(expectedPairs.length);
  for (const [matchIndex, expectedPair] of expectedPairs.entries()) {
    const match = required(stage.matchs[matchIndex], `stage ${stageIndex} match ${matchIndex}`);
    expect(ranksForMatch(match, playerSetIdByRank)).toEqual(expectedPair);
    expect(winnerRank(match, playerSetIdByRank)).toBe(expectedWinners[matchIndex]);
  }
}

/**
 * Verifies the fixed eight-seed graph and finals after an individual item is
 * completed. `expectedParticipantIdsByRank` comes from the official roster
 * GET, so generated IDs are checked without assuming fixture DB sequence.
 */
export async function assertCompletedIndividualBracket(
  request: APIRequestContext,
  eliminationId: number,
  expectedParticipantIdsByRank: readonly number[],
): Promise<IndividualSeedIdentities> {
  expect(expectedParticipantIdsByRank).toHaveLength(8);
  const detail = await readIndividualDetail(request, eliminationId);
  const identities = resolveIndividualSeedIdentities(detail);
  expect([...identities.participantIdByRank].sort(([left], [right]) => left - right).map(([, id]) => id)).toEqual(expectedParticipantIdsByRank);

  const quarterfinalPairs = Array.from({ length: 4 }, (_, index) => [individualSeedOrder[index * 2], individualSeedOrder[index * 2 + 1]] as const);
  assertStage(detail, 0, quarterfinalPairs, quarterfinalWinners, identities.playerSetIdByRank);
  assertStage(detail, 1, semifinalPairs, semifinalWinners, identities.playerSetIdByRank);
  // The literal final actions choose side 1 in gold (rank 1) and side 2 in
  // bronze (rank 3), yielding medals 1/2/3.
  assertStage(detail, 2, finalPairs, [1, 3], identities.playerSetIdByRank);

  const rankByPlayerSetId = new Map([...identities.playerSetIdByRank].map(([rank, id]) => [id, rank]));
  const medalsByType = new Map(detail.medals.map((medal) => [medal.type, required(rankByPlayerSetId.get(medal.player_set_id), `medal ${medal.type} set is out of bracket`)]));
  expect(medalsByType).toEqual(medalRanksByType);
  return identities;
}

/** Captures only independent event state needed for cross-group isolation checks. */
export async function snapshotIndividualEvent(
  request: APIRequestContext,
  competitionId: number,
  groupName: string,
): Promise<IndividualEventSnapshot> {
  const eliminationId = await resolveIndividualEliminationId(request, competitionId, groupName);
  const detail = await readIndividualDetail(request, eliminationId);
  return {
    eliminationId,
    currentStage: detail.current_stage,
    currentEnd: detail.current_end,
    medals: new Map(detail.medals.map((medal) => [medal.type, medal.player_set_id])),
  };
}

/** A completed operation in one group must not mutate the other group's item. */
export function assertIndividualProgressIsolation(
  aheadBefore: IndividualEventSnapshot,
  aheadAfter: IndividualEventSnapshot,
  unchangedBefore: IndividualEventSnapshot,
  unchangedAfter: IndividualEventSnapshot,
) {
  expect(aheadAfter.eliminationId).toBe(aheadBefore.eliminationId);
  expect(unchangedAfter.eliminationId).toBe(unchangedBefore.eliminationId);
  expect([aheadAfter.currentStage, aheadAfter.currentEnd]).not.toEqual([aheadBefore.currentStage, aheadBefore.currentEnd]);
  expect({
    currentStage: unchangedAfter.currentStage,
    currentEnd: unchangedAfter.currentEnd,
    medals: [...unchangedAfter.medals],
  }).toEqual({
    currentStage: unchangedBefore.currentStage,
    currentEnd: unchangedBefore.currentEnd,
    medals: [...unchangedBefore.medals],
  });
}
