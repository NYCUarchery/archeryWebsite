import { describe,expect,it } from "vitest";
import type { APIRequestContext } from "@playwright/test";
import { collectLifecycleResultSnapshot } from "../e2e/lifecycle/resultSnapshotCollector";
import { assertEquivalentLifecycleSnapshots,normalizeLifecycleSnapshot,type RawElimination,type RawLifecycleInput } from "../e2e/lifecycle/resultSnapshot";
const qualificationArrows=[10,9,8,7,6,5];
const individualArrows=[10,9,8];
const teamArrows=[10,10,9,9,8,8];
const sum=(values: number[]) => values.reduce((total,value) => total+value,0);
function qualificationPlayer(id: number,group: string,rank: number) {
  const arrows=qualificationArrows.map(score => Math.max(score-Math.floor((rank-1)/3),0));
  return { id,name: `${group} 選手 ${String(rank).padStart(2,"0")}`,rank,total_score: sum(arrows)*6,rounds: [{ round_ends: Array.from({ length: 6 },() => ({ is_confirmed: true,round_scores: arrows.map(score => ({ score })) })) }] };
}
function result(playerSetID: number,winner: boolean,teamSize: 1|3,end: number) {
  const arrows=teamSize===1? individualArrows:teamArrows;
  return { player_set_id: playerSetID,is_winner: winner,lane_number: 1,target: winner? ("A" as const):("B" as const),total_points: winner? 6:0,match_ends: Array.from({ length: teamSize===1? 5:4 },(_,index) => ({ is_confirmed: index<=end,total_scores: sum(arrows),points: index<=end? (winner? 2:0):null,cumulative_points: index<=end? (winner? 2*(index+1):0):0,match_scores: arrows.map(score => ({ score: index<=end? score:-1 })) })) };
}
function detail(base: number,group: string,teamSize: 1|3): RawElimination {
  const setCount=teamSize===1? 8:4;
  const members=(rank: number) => teamSize===1? [`${group} 選手 ${String(rank).padStart(2,"0")}`]:[rank,rank+4,rank+8].map(member => `${group} 選手 ${String(member).padStart(2,"0")}`);
  const ids=Array.from({ length: setCount },(_,index) => base+index+1);
  const stageSizes=teamSize===1? [4,2,2]:[2,2];
  const stage=(size: number,index: number) => ({
    matchs: Array.from({ length: size },(_,match) => {
      const left=ids[(match*2)%setCount]!;
      const right=ids[(match*2+1)%setCount]!;
      return { match_results: [result(left,true,teamSize,teamSize===1? 2:2),result(right,false,teamSize,teamSize===1? 2:2)] };
    })
  });
  return { id: base,team_size: teamSize,current_stage: stageSizes.length-1,current_end: 2,player_sets: ids.map((id,index) => ({ id,rank: index+1,set_name: `${group} ${teamSize===1? "個人":"團體"} ${index+1}`,total_score: 1000-index,players: members(index+1).map(name => ({ name })) })),stages: stageSizes.map(stage),medals: [{ type: 0,player_set_id: ids[0] },{ type: 1,player_set_id: ids[1] },{ type: 2,player_set_id: ids[2] }] };
}
function lifecycle(idOffset=0): RawLifecycleInput {
  const names=["反曲","複合"];
  return { groups: names.map((group,groupIndex) => ({ group_name: group,group_index: groupIndex,players: Array.from({ length: 12 },(_,index) => qualificationPlayer(idOffset+groupIndex*100+index+1,group,index+1)) })),eliminations: names.flatMap((group,index) => [{ groupName: group,detail: detail(idOffset+index*1000+100,group,1) },{ groupName: group,detail: detail(idOffset+index*1000+200,group,3) }]) };
}
function fakeRequest(routes: Record<string,unknown>,called: string[]) {
  return {
    get: async (path: string) => {
      called.push(path);
      const body=routes[path];
      return {
        ok: () => body!==undefined,
        status: () => body===undefined? 404:200,
        json: async () => body,
      };
    },
  } as unknown as APIRequestContext;
}

describe("lifecycle result snapshot",() => {
  it("ignores generated IDs while preserving all qualification arrows, bracket relations, teams, scores, and medals",() => {
    const first=lifecycle();
    const restarted=lifecycle(10000);
    restarted.groups.reverse();
    restarted.eliminations.reverse();
    for(const event of restarted.eliminations)
      event.detail.player_sets?.reverse();
    expect(normalizeLifecycleSnapshot(restarted)).toEqual(normalizeLifecycleSnapshot(first));
    expect(() => assertEquivalentLifecycleSnapshots(first,restarted)).not.toThrow();
  });
  it("detects changed arrows and swapped PlayerSet relations",() => {
    const before=lifecycle();
    const arrowChanged=lifecycle(100);
    arrowChanged.eliminations[0]!.detail.stages![0]!.matchs![0]!.match_results![0]!.match_ends![0]!.match_scores![1]!.score=7;
    expect(() => assertEquivalentLifecycleSnapshots(before,arrowChanged)).toThrow(/mismatch/);
    const swapped=lifecycle(200);
    const sides=swapped.eliminations[0]!.detail.stages![0]!.matchs![0]!.match_results!;
    [sides[0]!.player_set_id,sides[1]!.player_set_id]=[sides[1]!.player_set_id,sides[0]!.player_set_id];
    expect(() => assertEquivalentLifecycleSnapshots(before,swapped)).toThrow(/mismatch/);
  });
  it("rejects incomplete structural data instead of silently normalizing it",() => {
    const missingScores=lifecycle();
    missingScores.groups[0]!.players![0]!.rounds![0]!.round_ends![0]!.round_scores=undefined;
    expect(() => normalizeLifecycleSnapshot(missingScores)).toThrow(/missing .*scores/);
    const malformedBracket=lifecycle();
    malformedBracket.eliminations[0]!.detail.stages!.pop();
    expect(() => normalizeLifecycleSnapshot(malformedBracket)).toThrow(/expected 3 .*stages/);
  });
  it("fetches every player score tree when the official roster directory has no rounds",async () => {
    const source=lifecycle();
    const routes: Record<string,unknown>={};
    routes["/api/competition/groups/eliminations/42"]={ group_data: source.groups.map(group => ({ group_name: group.group_name,elimination_data: [1,3].map(team_size => ({ team_size,elimination_id: source.eliminations.find(event => event.groupName===group.group_name&&event.detail.team_size===team_size)!.detail.id })) })) };
    routes["/api/competition/groups/players/42"]={ groups: source.groups.map(group => ({ ...group,players: group.players!.map(({ rounds: _rounds,...player }) => player) })) };
    for(const group of source.groups)
      for(const player of group.players!)
        routes[`/api/player/scores/${player.id}`]={ id: player.id,rounds: player.rounds };
    for(const event of source.eliminations)
      routes[`/api/elimination/stages/scores/medals/${event.detail.id}`]=event.detail;
    const called: string[]=[];
    const collected=await collectLifecycleResultSnapshot(fakeRequest(routes,called),42);
    expect(called.filter(path => path.startsWith("/api/player/scores/")).length).toBe(24);
    expect(normalizeLifecycleSnapshot(collected)).toEqual(normalizeLifecycleSnapshot(source));
  });
});
