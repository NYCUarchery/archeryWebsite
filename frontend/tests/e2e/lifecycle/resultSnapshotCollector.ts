import type { APIRequestContext } from "@playwright/test";
import {
  type RawElimination,
  type RawLifecycleInput,
  type RawQualificationGroup,
  type RawQualificationPlayer,
} from "./resultSnapshot";

function required<T>(value: T|null|undefined,path: string): T {
  if(value===null||value===undefined) throw new Error(`lifecycle snapshot collector: missing ${path}`);
  return value;
}

function integer(value: number|undefined,path: string) {
  const result=required(value,path);
  if(!Number.isInteger(result)) throw new Error(`lifecycle snapshot collector: invalid ${path}`);
  return result;
}

async function getJSON<T>(request: APIRequestContext,path: string): Promise<T> {
  const response=await request.get(path);
  if(!response.ok()) throw new Error(`lifecycle snapshot collector: GET ${path} returned ${response.status()}`);
  return await response.json() as T;
}

/** groups/players has roster identity but no Round preload; merge official score trees only. */
async function collectGroupScores(request: APIRequestContext,group: RawQualificationGroup,path: string): Promise<RawQualificationGroup> {
  const players=required(group.players,`${path}.players`);
  const collected: RawQualificationPlayer[]=[];
  for(const [index,player] of players.entries()) {
    const playerID=integer(player.id,`${path}.players[${index}].id`);
    const scoreDetail=await getJSON<RawQualificationPlayer>(request,`/api/player/scores/${playerID}`);
    if(integer(scoreDetail.id,`player/scores/${playerID}.id`)!==playerID) throw new Error(`lifecycle snapshot collector: player/scores/${playerID} returned another player`);
    if(scoreDetail.name!==undefined&&scoreDetail.name!==player.name) throw new Error(`lifecycle snapshot collector: player/scores/${playerID} returned another name`);
    collected.push({ ...player,rounds: required(scoreDetail.rounds,`player/scores/${playerID}.rounds`) });
  }
  return { ...group,players: collected };
}

/** Read-only official API collector; it never writes scoring or fixture data. */
export async function collectLifecycleResultSnapshot(request: APIRequestContext,competitionId: number): Promise<RawLifecycleInput> {
  const directory=await getJSON<{ group_data?: Array<{ group_name?: string; elimination_data?: Array<{ elimination_id?: number; team_size?: number; }>; }>; }>(request,`/api/competition/groups/eliminations/${competitionId}`);
  const formalGroups=required(directory.group_data,"groups/eliminations group_data");
  if(formalGroups.length!==2) throw new Error(`lifecycle snapshot collector: expected 2 formal groups, got ${formalGroups.length}`);
  const roster=await getJSON<{ groups?: RawQualificationGroup[]; }>(request,`/api/competition/groups/players/${competitionId}`);
  const allGroups=required(roster.groups,"groups/players groups");
  const groups: RawQualificationGroup[]=[];
  for(const [index,entry] of formalGroups.entries()) {
    const groupName=required(entry.group_name,`group_data[${index}].group_name`);
    const group=required(allGroups.find(candidate => candidate.group_name===groupName),`groups/players ${groupName}`);
    groups.push(await collectGroupScores(request,group,`groups/players ${groupName}`));
  }
  const eliminations: RawLifecycleInput["eliminations"]=[];
  for(const [index,group] of formalGroups.entries()) {
    const groupName=required(group.group_name,`group_data[${index}].group_name`);
    const events=required(group.elimination_data,`group_data[${index}].elimination_data`);
    for(const teamSize of [1,3] as const) {
      const eliminationID=required(events.find(event => event.team_size===teamSize)?.elimination_id,`${groupName} team_size ${teamSize}`);
      eliminations.push({ groupName,detail: await getJSON<RawElimination>(request,`/api/elimination/stages/scores/medals/${eliminationID}`) });
    }
  }
  return { groups,eliminations };
}
