import { assertHybridApiWriteAllowed, type LifecycleExecutionMode } from "./execution";

/** Structural subset of Playwright's APIRequestContext/APIResponse. */
export type ApiResponse = { status(): number; ok(): boolean; json(): Promise<unknown> };
export type ApiRequestOptions = { data?: unknown };
export type ApiRequest = {
  get(path: string, options?: ApiRequestOptions): Promise<ApiResponse>;
  patch(path: string, options?: ApiRequestOptions): Promise<ApiResponse>;
  post(path: string, options?: ApiRequestOptions): Promise<ApiResponse>;
  put(path: string, options?: ApiRequestOptions): Promise<ApiResponse>;
};

export type ScopedActor = {
  role: "Judge" | "Player" | "Admin";
  username: string;
  competitionId: number;
  groupName: string;
};

type User = { id?: number };
type UserInfo = { id?: number; user_name?: string };
type Participant = { id?: number; user_id?: number; role?: string; status?: string };
type Score = { id?: number; score?: number };
type QualificationEnd = { id?: number; is_confirmed?: boolean; round_scores?: Score[] };
type Player = { id?: number; name?: string; participant_id?: number; lane_id?: number; total_score?: number; rounds?: Array<{ id?: number; total_score?: number; round_ends?: QualificationEnd[] }> };
type Group = { id?: number; group_id?: number; group_name?: string; players?: Player[] };
type Competition = { id?: number; qualification_current_end?: number; current_phase?: number; groups?: Group[] };
type PlayerSet = { id?: number; set_name?: string; players?: Array<{ id?: number; name?: string }> };
type MatchEnd = { id?: number; is_confirmed?: boolean; total_scores?: number; match_scores?: Score[] };
type MatchResult = { id?: number; player_set?: PlayerSet; player_set_id?: number; is_winner?: boolean; match_ends?: MatchEnd[] };
type Match = { id?: number; match_results?: MatchResult[] };
type Stage = { id?: number; matchs?: Match[] };
type Elimination = { id?: number; group_id?: number; team_size?: number; current_stage?: number; current_end?: number; player_sets?: PlayerSet[]; stages?: Stage[] };
type EliminationLookup = { group_data?: Array<{ group_id?: number; group_name?: string; elimination_data?: Array<{ elimination_id?: number; team_size?: number }> }> };

export type QualificationEndRef = {
  groupId: number;
  playerId: number;
  playerName: string;
  laneId: number;
  participantId: number;
  endId: number;
  endIndex: number;
  scoreIds: readonly number[];
  scoreCount: number;
  qualificationCurrentEnd: number;
};

export type MatchEndRef = {
  eliminationId: number;
  groupId: number;
  teamSize: 1 | 3;
  stageIndex: number;
  stageId: number;
  matchId: number;
  matchResultId: number;
  playerSetName: string;
  opponentSetName: string;
  endId: number;
  endIndex: number;
  scoreIds: readonly number[];
  scoreCount: number;
  currentEnd: number;
};

function required<T>(value: T | undefined | null, message: string): T {
  if (value === undefined || value === null) throw new Error(message);
  return value;
}

function id(value: number | undefined, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive ID`);
  return value;
}

function uniqueIds(scores: readonly Score[] | undefined, expectedCount: number, label: string): number[] {
  const values = scores?.map((score) => id(score.id, `${label} score`)) ?? [];
  if (values.length !== expectedCount) throw new Error(`${label} must contain exactly ${expectedCount} scores, got ${values.length}`);
  if (new Set(values).size !== values.length) throw new Error(`${label} has duplicate score IDs`);
  return values;
}

function sameScores(actual: readonly Score[] | undefined, scoreIds: readonly number[], expected: readonly number[], label: string) {
  if (expected.length !== scoreIds.length) throw new Error(`${label} expected score count mismatch`);
  const actualById = new Map((actual ?? []).map((score) => [score.id, score.score]));
  if (actualById.size !== scoreIds.length || scoreIds.some((scoreId, index) => actualById.get(scoreId) !== expected[index])) {
    throw new Error(`${label} readback differs for its resolved score IDs`);
  }
}

async function readJson<T>(response: ApiResponse, operation: string): Promise<T> {
  if (!response.ok()) throw new Error(`${operation} failed with HTTP ${response.status()}`);
  return await response.json() as T;
}

async function requireSuccess(response: ApiResponse, operation: string) {
  if (!response.ok()) throw new Error(`${operation} failed with HTTP ${response.status()}`);
}

/** Verify the session identity and approved competition role before any write. */
export async function readAuthenticatedUser(request: ApiRequest, expectedUsername: string): Promise<number> {
  const user = await readJson<User>(await request.get("/api/user/me"), "current user lookup");
  const userId = id(user.id, "current user");
  const detail = await readJson<UserInfo>(await request.get(`/api/user/${userId}`), "current user detail lookup");
  if (detail.id !== userId || detail.user_name !== expectedUsername) throw new Error(`authenticated user ${JSON.stringify(detail.user_name)} is not ${expectedUsername}`);
  return userId;
}

export async function assertApprovedScopedActor(request: ApiRequest, actor: ScopedActor): Promise<{ userId: number; participantId: number }> {
  const userId = await readAuthenticatedUser(request, actor.username);
  const participants = await readJson<Participant[]>(
    await request.get(`/api/participant/competition/${actor.competitionId}`),
    "participant lookup",
  );
  const participant = participants.find((candidate) => candidate.user_id === userId);
  if (!participant || participant.role !== actor.role || participant.status !== "approved") {
    throw new Error(`${actor.username} is not an approved ${actor.role} in competition ${actor.competitionId}`);
  }
  return { userId, participantId: id(participant.id, "approved participant") };
}

async function groupAndActorPlayer(request: ApiRequest, actor: ScopedActor, participantId: number, playerName: string) {
  const competition = await readJson<Competition>(
    await request.get(`/api/competition/groups/players/${actor.competitionId}`),
    "group/player lookup",
  );
  const group = required(competition.groups?.find((candidate) => candidate.group_name === actor.groupName), `group ${actor.groupName} not found`);
  const groupId = id(group.id ?? group.group_id, `group ${actor.groupName}`);
  const player = required(group.players?.find((candidate) => candidate.name === playerName), `player ${playerName} not found in ${actor.groupName}`);
  if (actor.role === "Player" && player.participant_id !== participantId) {
    throw new Error(`${actor.username} cannot score ${playerName}`);
  }
  return { competition, groupId, player };
}

/**
 * Resolve an already UI-selected qualification end through the official group
 * and player resources. End IDs are never inferred from fixture positions.
 */
export async function resolveQualificationEnd(
  request: ApiRequest,
  actor: ScopedActor,
  input: { playerName: string; endId: number; endIndex: number; requireCurrentQualificationEnd?: boolean },
): Promise<QualificationEndRef> {
  const identity = await assertApprovedScopedActor(request, actor);
  const { competition, groupId, player } = await groupAndActorPlayer(request, actor, identity.participantId, input.playerName);
  const currentEnd = required(competition.qualification_current_end, "qualification current end");
  if (input.requireCurrentQualificationEnd && input.endIndex !== currentEnd) {
    throw new Error(`qualification end ${input.endIndex} is outside current end ${currentEnd}`);
  }
  const playerId = id(player.id, `player ${input.playerName}`);
  const details = await readJson<Player>(await request.get(`/api/player/scores/${playerId}`), "qualification score lookup");
  const ends = details.rounds?.flatMap((round) => round.round_ends ?? []) ?? [];
  if (ends[input.endIndex]?.id !== input.endId) throw new Error(`qualification end ${input.endId} is not ordinal ${input.endIndex}`);
  const candidate = ends.find((end) => end.id === input.endId);
  const end = required(candidate, `end ${input.endId} does not belong to ${input.playerName}`);
  if (end.is_confirmed) throw new Error(`qualification end ${input.endId} is already confirmed; corrections require the UI correction helper`);
  return {
    groupId,
    playerId,
    playerName: input.playerName,
    laneId: id(player.lane_id, `player ${input.playerName} lane`),
    participantId: identity.participantId,
    endId: id(end.id, "qualification end"),
    endIndex: input.endIndex,
    scoreIds: uniqueIds(end.round_scores, 6, "qualification end").sort((left, right) => left - right),
    scoreCount: 6,
    qualificationCurrentEnd: currentEnd,
  };
}

/** Resolve the current end ID solely from official GET data for hybrid API fills. */
export async function resolveCurrentQualificationEnd(
  request: ApiRequest,
  actor: ScopedActor,
  playerName: string,
): Promise<QualificationEndRef> {
  const identity = await assertApprovedScopedActor(request, actor);
  const { competition, player } = await groupAndActorPlayer(request, actor, identity.participantId, playerName);
  const endIndex = required(competition.qualification_current_end, "qualification current end");
  const playerId = id(player.id, `player ${playerName}`);
  const detail = await readJson<Player>(await request.get(`/api/player/scores/${playerId}`), "qualification current end lookup");
  const end = detail.rounds?.flatMap((round) => round.round_ends ?? [])[endIndex];
  return await resolveQualificationEnd(request, actor, {
    playerName,
    endId: id(end?.id, `qualification current end ${endIndex}`),
    endIndex,
    requireCurrentQualificationEnd: true,
  });
}

/** Resolve an elimination ID from a competition/group/team-size relation. */
export async function resolveEliminationId(request: ApiRequest, actor: ScopedActor, teamSize: 1 | 3): Promise<number> {
  await assertApprovedScopedActor(request, actor);
  const body = await readJson<EliminationLookup>(
    await request.get(`/api/competition/groups/eliminations/${actor.competitionId}`),
    "formal elimination lookup",
  );
  const group = required(body.group_data?.find((item) => item.group_name === actor.groupName), `group ${actor.groupName} not found`);
  return id(group.elimination_data?.find((item) => item.team_size === teamSize)?.elimination_id, `${actor.groupName} team-size ${teamSize} elimination`);
}

/** Resolve a selected active-stage MatchEnd, including actual score IDs and roster scope. */
export async function resolveMatchEnd(
  request: ApiRequest,
  actor: ScopedActor,
  input: { teamSize: 1 | 3; playerSetName: string; opponentSetName: string; endId: number; endIndex: number },
): Promise<MatchEndRef> {
  const identity = await assertApprovedScopedActor(request, actor);
  const eliminationId = await resolveEliminationId(request, actor, input.teamSize);
  const detail = await readJson<Elimination>(
    await request.get(`/api/elimination/stages/scores/medals/${eliminationId}`),
    "elimination score lookup",
  );
  if (detail.id !== eliminationId || detail.team_size !== input.teamSize) throw new Error("elimination identity/team size mismatch");
  const groups = await readJson<Competition>(await request.get(`/api/competition/groups/players/${actor.competitionId}`), "group scope lookup");
  const group = required(groups.groups?.find((candidate) => candidate.group_name === actor.groupName), `group ${actor.groupName} not found`);
  const groupId = id(group.id ?? group.group_id, `group ${actor.groupName}`);
  if (detail.group_id !== groupId) throw new Error("elimination does not belong to actor group");
  const stageIndex = required(detail.current_stage, "elimination current stage");
  const currentEnd = required(detail.current_end, "elimination current end");
  if (input.endIndex !== currentEnd) throw new Error(`match end ${input.endIndex} is outside current end ${currentEnd}`);
  const stage = required(detail.stages?.[stageIndex], `current stage ${stageIndex} is missing`);
  for (const match of stage.matchs ?? []) {
    const results = match.match_results ?? [];
    const playerSet = (result: MatchResult, name: string) => detail.player_sets?.find((set) => set.id === result.player_set_id && set.set_name === name);
    const own = results.find((result) => playerSet(result, input.playerSetName) !== undefined);
    const opponent = results.find((result) => playerSet(result, input.opponentSetName) !== undefined);
    if (own?.match_ends?.[input.endIndex]?.id !== input.endId) continue;
    const end = own?.match_ends?.find((candidate) => candidate.id === input.endId);
    if (!own || !opponent || !end) continue;
    if (own.id === opponent.id) throw new Error("match opponents resolve to the same result");
    if (end.is_confirmed) throw new Error(`match end ${input.endId} is already confirmed; corrections require the UI correction helper`);
    if (actor.role === "Player") {
      const actorPlayer = required(group.players?.find((player) => player.participant_id === identity.participantId), `${actor.username} has no group player`);
      if (!playerSet(own, input.playerSetName)?.players?.some((player) => player.id === actorPlayer.id)) throw new Error(`${actor.username} is outside player set ${input.playerSetName}`);
    }
    return {
      eliminationId,
      groupId,
      teamSize: input.teamSize,
      stageIndex,
      stageId: id(stage.id, "current stage"),
      matchId: id(match.id, "current match"),
      matchResultId: id(own.id, "match result"),
      playerSetName: input.playerSetName,
      opponentSetName: input.opponentSetName,
      endId: id(end.id, "match end"),
      endIndex: input.endIndex,
      scoreIds: uniqueIds(end.match_scores, input.teamSize === 1 ? 3 : 6, "match end"),
      scoreCount: input.teamSize === 1 ? 3 : 6,
      currentEnd,
    };
  }
  throw new Error(`end ${input.endId} is not in active ${input.playerSetName} vs ${input.opponentSetName} match`);
}

/** Resolve a current-stage match side from official bracket data; no UI selection is needed. */
export async function resolveCurrentMatchEnd(
  request: ApiRequest,
  actor: ScopedActor,
  input: { teamSize: 1 | 3; matchIndex: number; side: 1 | 2 },
): Promise<MatchEndRef> {
  const eliminationId = await resolveEliminationId(request, actor, input.teamSize);
  const detail = await readJson<Elimination>(await request.get(`/api/elimination/stages/scores/medals/${eliminationId}`), "current match lookup");
  const stage = required(detail.stages?.[required(detail.current_stage, "elimination current stage")], "current stage");
  const match = required(stage.matchs?.[input.matchIndex], `match ${input.matchIndex + 1}`);
  const result = required(match.match_results?.[input.side - 1], `match ${input.matchIndex + 1} side ${input.side}`);
  const set = required(detail.player_sets?.find((candidate) => candidate.id === result.player_set_id), "current player set");
  const opponent = required(match.match_results?.[input.side === 1 ? 1 : 0], "current opponent result");
  const opponentSet = required(detail.player_sets?.find((candidate) => candidate.id === opponent.player_set_id), "current opponent player set");
  const endIndex = required(detail.current_end, "elimination current end");
  const endId = id(result.match_ends?.[endIndex]?.id, `match ${input.matchIndex + 1} current end`);
  return await resolveMatchEnd(request, actor, {
    teamSize: input.teamSize,
    playerSetName: required(set.set_name, "current player set name"),
    opponentSetName: required(opponentSet.set_name, "current opponent set name"),
    endId,
    endIndex,
  });
}

function arithmeticQualificationTotals(player: Player, ref: QualificationEndRef, expectedScores: readonly number[]) {
  let playerTotal = 0;
  let selectedRoundTotal: number | undefined;
  for (const round of player.rounds ?? []) {
    const roundTotal = (round.round_ends ?? []).reduce((sum, end) => sum + (end.round_scores ?? []).reduce((endSum, score) => {
      const replacement = end.id === ref.endId ? expectedScores[ref.scoreIds.indexOf(id(score.id, "qualification readback score"))] : score.score;
      return endSum + Math.max(0, replacement ?? 0);
    }, 0), 0);
    playerTotal += roundTotal;
    if ((round.round_ends ?? []).some((end) => end.id === ref.endId)) selectedRoundTotal = roundTotal;
  }
  return { roundTotal: required(selectedRoundTotal, "qualification end round"), playerTotal };
}

export async function readQualificationEnd(request: ApiRequest, ref: QualificationEndRef, expectedScores: readonly number[]) {
  const player = await readJson<Player>(await request.get(`/api/player/scores/${ref.playerId}`), "qualification score readback");
  const end = required(player.rounds?.flatMap((round) => round.round_ends ?? []).find((candidate) => candidate.id === ref.endId), `qualification end ${ref.endId} vanished`);
  if (!end.is_confirmed) throw new Error(`qualification end ${ref.endId} is not confirmed`);
  sameScores(end.round_scores, ref.scoreIds, expectedScores, "qualification");
  const expected = arithmeticQualificationTotals(player, ref, expectedScores);
  const round = required(player.rounds?.find((candidate) => candidate.round_ends?.some((candidateEnd) => candidateEnd.id === ref.endId)), "qualification end round");
  if (round.total_score !== expected.roundTotal || player.total_score !== expected.playerTotal) {
    throw new Error(`qualification total readback differs: expected round/player ${expected.roundTotal}/${expected.playerTotal}, got ${round.total_score}/${player.total_score}`);
  }
}

export async function readMatchEnd(request: ApiRequest, ref: MatchEndRef, expectedScores: readonly number[]) {
  const detail = await readJson<Elimination>(await request.get(`/api/elimination/stages/scores/medals/${ref.eliminationId}`), "elimination readback");
  const end = detail.stages?.flatMap((stage) => stage.matchs ?? []).flatMap((match) => match.match_results ?? [])
    .flatMap((result) => result.match_ends ?? []).find((candidate) => candidate.id === ref.endId);
  const resolved = required(end, `match end ${ref.endId} vanished`);
  if (!resolved.is_confirmed) throw new Error(`match end ${ref.endId} is not confirmed`);
  sameScores(resolved.match_scores, ref.scoreIds, expectedScores, "elimination");
  const expectedTotal = expectedScores.reduce((sum, score) => sum + score, 0);
  if (resolved.total_scores !== expectedTotal) throw new Error(`match total readback differs: expected ${expectedTotal}, got ${resolved.total_scores}`);
}

export async function writeQualificationEnd(
  mode: LifecycleExecutionMode,
  request: ApiRequest,
  actor: ScopedActor,
  ref: QualificationEndRef,
  scores: readonly number[],
) {
  assertHybridApiWriteAllowed(mode);
  if (scores.length !== ref.scoreCount) throw new Error(`qualification score count must be ${ref.scoreCount}`);
  const checked = await resolveQualificationEnd(request, actor, {
    playerName: ref.playerName, endId: ref.endId, endIndex: ref.endIndex, requireCurrentQualificationEnd: true,
  });
  if (checked.playerId !== ref.playerId || checked.groupId !== ref.groupId || checked.scoreIds.join(",") !== ref.scoreIds.join(",")) {
    throw new Error("qualification write scope changed after resolution");
  }
  await requireSuccess(await request.patch(`/api/player/all-endscores/${checked.endId}`, { data: { scores } }), "qualification score write");
  await requireSuccess(await request.patch(`/api/player/isconfirmed/${checked.endId}`, { data: { is_confirmed: true } }), "qualification confirmation");
  await readQualificationEnd(request, checked, scores);
}

export async function writeMatchEnd(
  mode: LifecycleExecutionMode,
  request: ApiRequest,
  actor: ScopedActor,
  ref: MatchEndRef,
  scores: readonly number[],
) {
  assertHybridApiWriteAllowed(mode);
  if (scores.length !== ref.scoreCount || scores.length !== ref.scoreIds.length) throw new Error(`match score count must be ${ref.scoreCount}`);
  const checked = await resolveMatchEnd(request, actor, {
    teamSize: ref.teamSize, playerSetName: ref.playerSetName, opponentSetName: ref.opponentSetName,
    endId: ref.endId, endIndex: ref.endIndex,
  });
  if (checked.matchId !== ref.matchId || checked.groupId !== ref.groupId || checked.scoreIds.join(",") !== ref.scoreIds.join(",")) {
    throw new Error("match write scope changed after resolution");
  }
  await requireSuccess(await request.patch(`/api/matchresult/matchend/scores/${checked.endId}`, {
    data: { match_score_ids: checked.scoreIds, scores },
  }), "elimination score write");
  await requireSuccess(await request.patch(`/api/matchresult/matchend/isconfirmed/${checked.endId}`, { data: { is_confirmed: true } }), "elimination confirmation");
  await readMatchEnd(request, checked, scores);
}
