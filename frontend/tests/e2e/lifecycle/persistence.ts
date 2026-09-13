import { expect, type APIRequestContext, type Browser, type Page } from "@playwright/test";
import { admin, signIn } from "./actors";

type GroupPlayers = {
  group_name: string;
  group_index: number;
  players: Array<{ name: string; rank: number; total_score: number }>;
};

type EliminationRef = { groupName: string; groupIndex: number; teamSize: 1 | 3; id: number };

type RestartPersistenceOptions = {
  browser: Browser;
  baseURL: string;
  competitionId: number;
  restartBackend: () => Promise<void>;
};

function required<T>(value: T | undefined, message: string): T {
  expect(value, message).toBeDefined();
  return value as T;
}

async function groupPlayersSnapshot(request: APIRequestContext, competitionId: number) {
  const response = await request.get(`/api/competition/groups/players/${competitionId}`);
  expect(response.ok()).toBeTruthy();
  return await response.json() as { groups: GroupPlayers[] };
}

async function eliminationRefs(request: APIRequestContext, competitionId: number, groups: readonly GroupPlayers[]): Promise<EliminationRef[]> {
  const response = await request.get(`/api/competition/groups/eliminations/${competitionId}`);
  expect(response.ok()).toBeTruthy();
  const body = await response.json() as {
    group_data: Array<{ group_name: string; elimination_data: Array<{ elimination_id: number; team_size: number }> }>;
  };
  return groups
    .filter((group) => group.group_name !== "unassigned")
    .flatMap((group) => [1, 3].map((teamSize) => {
      const event = required(body.group_data.find((item) => item.group_name === group.group_name)?.elimination_data.find((item) => item.team_size === teamSize), `${group.group_name} team-size ${teamSize} elimination`);
      return { groupName: group.group_name, groupIndex: group.group_index, teamSize: teamSize as 1 | 3, id: event.elimination_id };
    }));
}

async function fullEliminationSnapshots(request: APIRequestContext, refs: readonly EliminationRef[]) {
  const snapshots = new Map<number, unknown>();
  for (const ref of refs) {
    const response = await request.get(`/api/elimination/stages/scores/medals/${ref.id}`);
    expect(response.ok()).toBeTruthy();
    snapshots.set(ref.id, await response.json());
  }
  return snapshots;
}

async function assertPublicReadback(page: Page, competitionId: number, groups: readonly GroupPlayers[], refs: readonly EliminationRef[], detailByID: ReadonlyMap<number, unknown>) {
  for (const group of groups.filter((item) => item.group_name !== "unassigned")) {
    const leader = required([...group.players].sort((left, right) => left.rank - right.rank)[0], `${group.group_name} qualification leader`);
    await page.goto(`/competition/${competitionId}/scoreboard/${group.group_index}/qualification`);
    await expect(page.locator(".qualification_board").getByText(leader.name, { exact: true })).toBeVisible();
    for (const teamSize of [1, 3] as const) {
      const ref = required(refs.find((item) => item.groupName === group.group_name && item.teamSize === teamSize), `${group.group_name} public team-size ${teamSize}`);
      const detail = required(detailByID.get(ref.id), `${group.group_name} detail snapshot`) as { player_sets?: Array<{ set_name: string; rank: number }> };
      const firstSet = required(detail.player_sets?.[0], `${group.group_name} team-size ${teamSize} first set`);
      await page.goto(`/competition/${competitionId}/scoreboard/${group.group_index}/elimination/${teamSize}`);
      await expect(page.locator("svg").getByText(`No.${firstSet.rank} ${firstSet.set_name}`, { exact: true }).first()).toBeVisible();
    }
  }
}

/**
 * Restarts only the isolated backend after the four items are complete. The
 * fixture intentionally closes every existing context, so this helper never
 * reads the old Admin/Judge/Player pages after invoking restartBackend.
 */
export async function assertLifecyclePersistsAfterRestart(options: RestartPersistenceOptions) {
  const { browser, baseURL, competitionId, restartBackend } = options;
  const preContext = await browser.newContext({ baseURL });
  try {
    const beforeGroups = await groupPlayersSnapshot(preContext.request, competitionId);
    const beforeRefs = await eliminationRefs(preContext.request, competitionId, beforeGroups.groups);
    expect(beforeRefs).toHaveLength(4);
    const beforeDetails = await fullEliminationSnapshots(preContext.request, beforeRefs);

    await restartBackend();

    const adminContext = await browser.newContext({ baseURL });
    const visitorContext = await browser.newContext({ baseURL });
    try {
      const adminPage = await adminContext.newPage();
      await signIn(adminPage, admin);
      const [adminIdentity, participants, afterGroups] = await Promise.all([
        adminPage.request.get("/api/user/me"),
        adminPage.request.get(`/api/participant/competition/${competitionId}`),
        groupPlayersSnapshot(adminPage.request, competitionId),
      ]);
      expect(adminIdentity.ok()).toBeTruthy();
      expect(participants.ok()).toBeTruthy();
      const adminID = (await adminIdentity.json() as { id: number }).id;
      expect((await participants.json() as Array<{ user_id: number; role: string; status: string }>).find((item) => item.user_id === adminID)).toMatchObject({ role: "Admin", status: "approved" });
      expect(afterGroups).toEqual(beforeGroups);

      const afterRefs = await eliminationRefs(adminPage.request, competitionId, afterGroups.groups);
      expect(afterRefs).toEqual(beforeRefs);
      const afterDetails = await fullEliminationSnapshots(adminPage.request, afterRefs);
      expect(afterDetails).toEqual(beforeDetails);

      const competition = await adminPage.request.get(`/api/competition/${competitionId}`);
      expect(competition.ok()).toBeTruthy();
      expect(await competition.json()).toMatchObject({ current_phase: 2, team_elimination_is_active: true });

      const visitorPage = await visitorContext.newPage();
      await assertPublicReadback(visitorPage, competitionId, afterGroups.groups, afterRefs, afterDetails);
    } finally {
      await Promise.all([adminContext.close(), visitorContext.close()]);
    }
  } finally {
    // restartBackend may already have closed this context; close remains safe.
    await preContext.close();
  }
}
