/** ID-free, completed two-group lifecycle snapshot for cross-mode comparisons. */
export type RawScore={
  score?: number;
};
export type RawQualificationEnd={
  is_confirmed?: boolean;
  round_scores?: RawScore[];
};
export type RawQualificationPlayer={
  id?: number;
  name?: string;
  rank?: number;
  total_score?: number;
  rounds?: Array<{
    round_ends?: RawQualificationEnd[];
  }>;
};
export type RawQualificationGroup={
  group_name?: string;
  group_index?: number;
  players?: RawQualificationPlayer[];
};
export type RawPlayerSet={
  id?: number;
  rank?: number;
  set_name?: string;
  total_score?: number;
  players?: Array<{
    name?: string;
  }>;
};
export type RawElimination={
  id?: number;
  team_size?: number;
  current_stage?: number;
  current_end?: number;
  player_sets?: RawPlayerSet[];
  stages?: Array<{
    matchs?: Array<{
      match_results?: Array<{
        player_set_id?: number;
        is_winner?: boolean;
        lane_number?: number;
        target?: "A"|"B"|null;
        total_points?: number;
        shoot_off_score?: number;
        match_ends?: Array<{
          is_confirmed?: boolean;
          total_scores?: number;
          points?: number|null;
          cumulative_points?: number;
          match_scores?: RawScore[];
        }>;
      }>;
    }>;
  }>;
  medals?: Array<{
    type?: number;
    player_set_id?: number;
  }>;
};
export type RawLifecycleInput={
  groups: RawQualificationGroup[];
  eliminations: Array<{
    groupName: string;
    detail: RawElimination;
  }>;
};
export type LifecycleSnapshot={
  groups: Array<{
    name: string;
    qualification: Array<{
      name: string;
      rank: number;
      totalScore: number;
      ends: Array<{
        confirmed: boolean;
        scores: number[];
      }>;
    }>;
  }>;
  brackets: Array<{
    groupName: string;
    teamSize: number;
    progress: {
      stage: number;
      end: number;
    };
    playerSets: Array<{
      key: string;
      rank: number;
      name: string;
      totalScore: number;
      members: string[];
    }>;
    stages: Array<{
      index: number;
      matches: Array<{
        index: number;
        sides: Array<{
          side: number;
          playerSet: string;
          winner: boolean;
          lane: number|null;
          target: "A"|"B"|null;
          totalPoints: number;
          shootOffScore: number|null;
          ends: Array<{
            confirmed: boolean;
            totalScore: number;
            points: number|null;
            cumulativePoints: number;
            scores: number[];
          }>;
        }>;
      }>;
    }>;
    medals: Array<{
      type: number;
      playerSet: string;
    }>;
  }>;
};
function required<T>(v: T | null | undefined, p: string): T {
  if (v === null || v === undefined) throw new Error(`lifecycle snapshot: missing ${p}`);
  return v;
}

function integer(v: number | null | undefined, p: string) {
  const n = required(v, p);
  if (!Number.isInteger(n)) throw new Error(`lifecycle snapshot: invalid ${p}`);
  return n;
}

function name(v: string | undefined, p: string) {
  const s = required(v, p).trim();
  if (!s) throw new Error(`lifecycle snapshot: empty ${p}`);
  return s;
}

function count<T>(v: readonly T[], n: number, p: string) {
  if (v.length !== n) throw new Error(`lifecycle snapshot: expected ${n} ${p}, got ${v.length}`);
}

function unique<T>(v: readonly T[], key: (x: T) => string, p: string) {
  const seen = new Set<string>();
  for (const x of v) {
    const k = key(x);
    if (seen.has(k)) throw new Error(`lifecycle snapshot: duplicate ${p} ${k}`);
    seen.add(k);
  }
}

function ranks(v: Array<{ rank: number }>, n: number, p: string) {
  const actual = v.map(x => x.rank).sort((a, b) => a - b);
  const expected = Array.from({ length: n }, (_, i) => i + 1);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`lifecycle snapshot: expected ranks 1..${n} for ${p}`);
}
/** Arrow storage order is nonsemantic; retain each arrow as a canonical multiset. */
function scores(v: RawScore[] | undefined, n: number, p: string) {
  const result = required(v, p).map((x, i) => {
    const score = integer(x.score, `${p}[${i}]`);
    if (score < -1 || score > 11) throw new Error(`lifecycle snapshot: invalid arrow score ${p}[${i}]`);
    return score;
  });
  count(result, n, `${p} arrows`);
  return result.sort((a, b) => a - b);
}

function setKey(set: RawPlayerSet, p: string) {
  return `${integer(set.rank, `${p}.rank`)}:${name(set.set_name, `${p}.set_name`)}`;
}
function qualification(group: RawQualificationGroup, p: string) {
  const source = required(group.players, `${p}.players`);
  count(source, 12, `${p}.players`);
  const result = source.map((player, i) => {
    const rounds = required(player.rounds, `${p}.players[${i}].rounds`);
    count(rounds, 1, `${p}.players[${i}].rounds`);
    const ends = required(rounds[0]?.round_ends, `${p}.players[${i}].rounds[0].round_ends`);
    count(ends, 6, `${p}.players[${i}].ends`);
    return {
      name: name(player.name, `${p}.players[${i}].name`),
      rank: integer(player.rank, `${p}.players[${i}].rank`),
      totalScore: integer(player.total_score, `${p}.players[${i}].total_score`),
      ends: ends.map((end, j) => ({
        confirmed: required(end.is_confirmed, `${p}.players[${i}].ends[${j}].is_confirmed`),
        scores: scores(end.round_scores, 6, `${p}.players[${i}].ends[${j}].scores`),
      })),
    };
  });
  unique(result, x => x.name, `${p}.player name`);
  unique(result, x => String(x.rank), `${p}.player rank`);
  ranks(result, 12, `${p}.players`);
  return result.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
}
function bracket(groupName: string, detail: RawElimination, p: string): LifecycleSnapshot["brackets"][number] {
  const teamSize = integer(detail.team_size, `${p}.team_size`);
  if (teamSize !== 1 && teamSize !== 3) throw new Error(`lifecycle snapshot: unsupported ${p}.team_size ${teamSize}`);
  const setCount = teamSize === 1 ? 8 : 4;
  const matchesByStage = teamSize === 1 ? [4, 2, 2] : [2, 2];
  const endCount = teamSize === 1 ? 5 : 4;
  const arrowCount = teamSize === 1 ? 3 : 6;
  const sourceSets = required(detail.player_sets, `${p}.player_sets`);
  count(sourceSets, setCount, `${p}.player_sets`);
  const sets = sourceSets.map((set, i) => {
    const setPath = `${p}.player_sets[${i}]`;
    const members = required(set.players, `${setPath}.players`).map((member, j) => name(member.name, `${setPath}.players[${j}].name`));
    count(members, teamSize, `${setPath}.players`);
    unique(members, x => x, `${setPath}.member`);
    return {
      id: integer(set.id, `${setPath}.id`),
      key: setKey(set, setPath),
      rank: integer(set.rank, `${setPath}.rank`),
      name: name(set.set_name, `${setPath}.set_name`),
      totalScore: integer(set.total_score, `${setPath}.total_score`),
      members: members.sort(),
    };
  });
  unique(sets, x => String(x.id), `${p}.player set id`);
  unique(sets, x => x.key, `${p}.player set key`);
  unique(sets.flatMap(x => x.members), x => x, `${p}.player set member`);
  ranks(sets, setCount, `${p}.player_sets`);
  const keyByID = new Map(sets.map(x => [x.id, x.key]));
  const resolve = (id: number | undefined, at: string) => {
    const value = integer(id, `${at}.player_set_id`);
    const key = keyByID.get(value);
    if (!key) throw new Error(`lifecycle snapshot: unresolved ${at}.player_set reference ${value}`);
    return key;
  };
  const sourceStages = required(detail.stages, `${p}.stages`);
  count(sourceStages, matchesByStage.length, `${p}.stages`);
  const stages = sourceStages.map((stage, si) => {
    const sourceMatches = required(stage.matchs, `${p}.stages[${si}].matchs`);
    count(sourceMatches, matchesByStage[si]!, `${p}.stages[${si}].matchs`);
    return {
      index: si,
      matches: sourceMatches.map((match, mi) => {
        const results = required(match.match_results, `${p}.stages[${si}].matchs[${mi}].match_results`);
        count(results, 2, `${p}.stages[${si}].matchs[${mi}].match_results`);
        return {
          index: mi,
          sides: results.map((result, side) => {
            const sidePath = `${p}.stages[${si}].matches[${mi}].sides[${side}]`;
            const ends = required(result.match_ends, `${sidePath}.match_ends`);
            count(ends, endCount, `${p}.stages[${si}].matches[${mi}].side ${side + 1}.ends`);
            return {
              side: side + 1,
              playerSet: resolve(result.player_set_id, sidePath),
              winner: required(result.is_winner, `${sidePath}.is_winner`),
              lane: result.lane_number ?? null,
              target: result.target ?? null,
              totalPoints: integer(result.total_points, `${sidePath}.total_points`),
              shootOffScore: result.shoot_off_score ?? null,
              ends: ends.map((end, ei) => ({
                confirmed: required(end.is_confirmed, `${sidePath}.ends[${ei}].is_confirmed`),
                totalScore: integer(end.total_scores, `${sidePath}.ends[${ei}].total_scores`),
                points: end.points ?? null,
                cumulativePoints: integer(end.cumulative_points, `${sidePath}.ends[${ei}].cumulative_points`),
                scores: scores(end.match_scores, arrowCount, `${sidePath}.ends[${ei}].scores`),
              })),
            };
          }),
        };
      }),
    };
  });
  const medals = required(detail.medals, `${p}.medals`).map((medal, i) => ({
    type: integer(medal.type, `${p}.medals[${i}].type`),
    playerSet: resolve(medal.player_set_id, `${p}.medals[${i}]`),
  }));
  count(medals, 3, `${p}.medals`);
  unique(medals, x => String(x.type), `${p}.medal type`);
  if (JSON.stringify(medals.map(x => x.type).sort((a, b) => a - b)) !== JSON.stringify([0, 1, 2])) {
    throw new Error(`lifecycle snapshot: expected gold, silver, and bronze medals for ${p}`);
  }
  const progress = {
    stage: integer(detail.current_stage, `${p}.current_stage`),
    end: integer(detail.current_end, `${p}.current_end`),
  };
  if (progress.stage !== matchesByStage.length - 1 || progress.end < 0 || progress.end >= endCount) {
    throw new Error(`lifecycle snapshot: invalid completed progress for ${p}`);
  }
  return {
    groupName,
    teamSize,
    progress,
    playerSets: sets.map(({ id: _id, ...set }) => set).sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name)),
    stages,
    medals: medals.sort((a, b) => a.type - b.type),
  };
}
export function normalizeLifecycleSnapshot(input: RawLifecycleInput): LifecycleSnapshot {
  count(input.groups, 2, "groups");
  count(input.eliminations, 4, "brackets");
  unique(input.groups, x => name(x.group_name, "group.group_name"), "group name");
  const groups = input.groups.map((group, i) => ({
    name: name(group.group_name, `groups[${i}].group_name`),
    qualification: qualification(group, `groups[${i}]`),
  })).sort((a, b) => a.name.localeCompare(b.name));
  const names = new Set(groups.map(x => x.name));
  const brackets = input.eliminations.map((event, i) => {
    if (!names.has(event.groupName)) throw new Error(`lifecycle snapshot: unresolved bracket group ${event.groupName}`);
    return bracket(event.groupName, event.detail, `eliminations[${i}]`);
  });
  unique(brackets, x => `${x.groupName}:${x.teamSize}`, "bracket key");
  for (const group of groups) {
    for (const teamSize of [1, 3]) {
      if (!brackets.some(x => x.groupName === group.name && x.teamSize === teamSize)) {
        throw new Error(`lifecycle snapshot: missing ${group.name} team_size ${teamSize} bracket`);
      }
    }
  }
  return { groups, brackets: brackets.sort((a, b) => a.groupName.localeCompare(b.groupName) || a.teamSize - b.teamSize) };
}
export function assertEquivalentLifecycleSnapshots(before: RawLifecycleInput, after: RawLifecycleInput) {
  const expected = normalizeLifecycleSnapshot(before);
  const actual = normalizeLifecycleSnapshot(after);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error(`lifecycle snapshot mismatch\nexpected: ${JSON.stringify(expected)}\nactual: ${JSON.stringify(actual)}`);
  }
}
