import { afterEach, expect, test, vi } from "vitest";
import {
  assertApprovedScopedActor,
  resolveMatchEnd,
  resolveCurrentMatchEnd,
  resolveQualificationEnd,
  writeMatchEnd,
  writeQualificationEnd,
  type ApiRequest,
  type ApiResponse,
  type ScopedActor,
} from "../e2e/lifecycle/formalApi";
import { applyIndependentApiApplicant, approvePendingApiApplicant } from "../e2e/lifecycle/hybridActors";
import { assertQualificationBatchPatches } from "../e2e/lifecycle/qualification";
import {
  assertHybridApiWriteAllowed,
  hybridEliminationSamples,
  hybridEliminationWritePlan,
  hybridQualificationSamples,
  hybridQualificationWritePlan,
  parseLifecycleExecutionMode,
} from "../e2e/lifecycle/execution";

function response(status: number, body: unknown = {}): ApiResponse {
  return { status: () => status, ok: () => status >= 200 && status < 300, json: async () => body };
}

const actor: ScopedActor = { role: "Judge", username: "judge", competitionId: 9, groupName: "A" };

function fixture(config: { scoreWriteStatus?: number; duplicateScores?: boolean; readbackScores?: number[]; approved?: boolean; username?: string; detailId?: number } = {}) {
  const calls: Array<{ method: string; path: string; data?: unknown }> = [];
  const qualificationEnd = { id: 31, is_confirmed: false, round_scores: [
    { id: 101, score: -1 }, { id: 102, score: -1 }, { id: 103, score: -1 },
    { id: 104, score: -1 }, { id: 105, score: -1 }, { id: 106, score: -1 },
  ] };
  const matchEnd = { id: 41, is_confirmed: false, total_scores: 0, match_scores: [
    { id: 201, score: -1 }, { id: config.duplicateScores ? 201 : 307, score: -1 }, { id: 4_001, score: -1 },
  ] };
  const get = (path: string) => {
    if (path === "/api/user/me") return response(200, { id: 4 });
    if (path === "/api/user/4") return response(200, { id: config.detailId ?? 4, user_name: config.username ?? "judge" });
    if (path === "/api/participant/competition/9") return response(200, [{ id: 44, user_id: 4, role: "Judge", status: config.approved === false ? "pending" : "approved" }]);
    if (path === "/api/competition/groups/players/9") return response(200, {
      qualification_current_end: 0,
      groups: [{ id: 77, group_name: "A", players: [{ id: 55, name: "Archer", participant_id: 45, lane_id: 301 }] }],
    });
    if (path === "/api/player/scores/55") {
      const total = qualificationEnd.round_scores.reduce((sum, score) => sum + Math.max(0, score.score), 0);
      return response(200, { id: 55, total_score: total, rounds: [{ id: 71, total_score: total, round_ends: [qualificationEnd] }] });
    }
    if (path === "/api/competition/groups/eliminations/9") return response(200, {
      group_data: [{ group_id: 77, group_name: "A", elimination_data: [{ elimination_id: 88, team_size: 1 }] }],
    });
    if (path === "/api/elimination/stages/scores/medals/88") return response(200, {
      id: 88, group_id: 77, team_size: 1, current_stage: 0, current_end: 0,
      player_sets: [
        { id: 501, set_name: "A1", players: [{ id: 55, name: "Archer" }] },
        { id: 502, set_name: "A2", players: [{ id: 56, name: "Other" }] },
      ],
      stages: [{ id: 66, matchs: [{ id: 65, match_results: [
        { id: 64, player_set_id: 501, match_ends: [matchEnd] },
        { id: 63, player_set_id: 502, match_ends: [{ id: 42, match_scores: [] }] },
      ] }] }],
    });
    throw new Error(`unexpected GET ${path}`);
  };
  const request: ApiRequest = {
    get: async (path) => { calls.push({ method: "GET", path }); return get(path); },
    post: async (path, options) => { calls.push({ method: "POST", path, data: options?.data }); return response(200); },
    put: async (path, options) => { calls.push({ method: "PUT", path, data: options?.data }); return response(200); },
    patch: async (path, options) => {
      calls.push({ method: "PATCH", path, data: options?.data });
      if (path === "/api/player/all-endscores/31") {
        if ((config.scoreWriteStatus ?? 200) >= 300) return response(config.scoreWriteStatus ?? 500);
        qualificationEnd.round_scores.forEach((score, index) => { score.score = (options.data as { scores: number[] }).scores[index]; });
      }
      if (path === "/api/player/isconfirmed/31") qualificationEnd.is_confirmed = true;
      if (path === "/api/matchresult/matchend/scores/41") {
        matchEnd.match_scores.forEach((score, index) => { score.score = (options.data as { scores: number[] }).scores[index]; });
        matchEnd.total_scores = matchEnd.match_scores.reduce((sum, score) => sum + score.score, 0);
      }
      if (path === "/api/matchresult/matchend/isconfirmed/41") matchEnd.is_confirmed = true;
      if (config.readbackScores && path.includes("scores/41")) matchEnd.match_scores.forEach((score, index) => { score.score = config.readbackScores![index]; });
      return response(200);
    },
  };
  return { request, calls };
}

function teamFixture(config: { wrongGroup?: boolean } = {}) {
  const calls: Array<{ method: string; path: string; data?: unknown }> = [];
  const left = { id: 71, is_confirmed: false, total_scores: 0, match_scores: [101, 202, 303, 404, 505, 606].map((id) => ({ id, score: -1 })) };
  const right = { id: 72, is_confirmed: false, total_scores: 0, match_scores: [107, 208, 309, 410, 511, 612].map((id) => ({ id, score: -1 })) };
  const detail = () => ({ id: 89, group_id: config.wrongGroup ? 999 : 77, team_size: 3, current_stage: 0, current_end: 0,
    player_sets: [{ id: 501, set_name: "Team A", players: [{ id: 55, name: "Archer" }] }, { id: 502, set_name: "Team B", players: [{ id: 56, name: "Other" }] }],
    stages: [{ id: 66, matchs: [{ id: 65, match_results: [{ id: 64, player_set_id: 501, match_ends: [left] }, { id: 63, player_set_id: 502, match_ends: [right] }] }] }],
  });
  const request: ApiRequest = {
    get: async (path) => {
      calls.push({ method: "GET", path });
      if (path === "/api/user/me") return response(200, { id: 4 });
      if (path === "/api/user/4") return response(200, { id: 4, user_name: "judge" });
      if (path === "/api/participant/competition/9") return response(200, [{ id: 44, user_id: 4, role: "Judge", status: "approved" }]);
      if (path === "/api/competition/groups/players/9") return response(200, { groups: [{ id: 77, group_name: "A", players: [{ id: 55, name: "Archer", participant_id: 45, lane_id: 301 }] }] });
      if (path === "/api/competition/groups/eliminations/9") return response(200, { group_data: [{ group_id: 77, group_name: "A", elimination_data: [{ elimination_id: 89, team_size: 3 }] }] });
      if (path === "/api/elimination/stages/scores/medals/89") return response(200, detail());
      throw new Error(`unexpected GET ${path}`);
    },
    post: async () => response(200), put: async () => response(200),
    patch: async (path, options) => {
      calls.push({ method: "PATCH", path, data: options?.data });
      const end = path.endsWith("/71") ? left : path.endsWith("/72") ? right : undefined;
      if (!end) return response(404);
      if (path.includes("/scores/")) {
        end.match_scores.forEach((score, index) => { score.score = (options?.data as { scores: number[] }).scores[index]; });
        end.total_scores = end.match_scores.reduce((sum, score) => sum + score.score, 0);
      } else end.is_confirmed = true;
      return response(200);
    },
  };
  return { request, calls };
}

afterEach(() => vi.unstubAllEnvs());

test("mode parser defaults to hybrid, accepts only both explicit modes, and isolates its environment", () => {
  const inherited = process.env.ARCHERY_E2E_MODE;
  try {
    delete process.env.ARCHERY_E2E_MODE;
    expect(parseLifecycleExecutionMode()).toBe("hybrid");
  } finally {
    if (inherited === undefined) delete process.env.ARCHERY_E2E_MODE;
    else process.env.ARCHERY_E2E_MODE = inherited;
  }
  vi.stubEnv("ARCHERY_E2E_MODE", "full-ui");
  expect(parseLifecycleExecutionMode()).toBe("full-ui");
  vi.stubEnv("ARCHERY_E2E_MODE", "hybrid");
  expect(parseLifecycleExecutionMode()).toBe("hybrid");
  expect(parseLifecycleExecutionMode("hybrid")).toBe("hybrid");
  expect(parseLifecycleExecutionMode("full-ui")).toBe("full-ui");
  expect(() => parseLifecycleExecutionMode("")).toThrow("ARCHERY_E2E_MODE");
  expect(() => parseLifecycleExecutionMode(" ")).toThrow("ARCHERY_E2E_MODE");
  expect(() => parseLifecycleExecutionMode("fast")).toThrow("ARCHERY_E2E_MODE");
  expect(() => assertHybridApiWriteAllowed("full-ui")).toThrow("require ARCHERY_E2E_MODE=hybrid");
  expect(hybridQualificationSamples).toHaveLength(4);
  expect(hybridQualificationWritePlan).toHaveLength(144);
  expect(hybridQualificationWritePlan.filter((sample) => sample.actor === "player-ui")).toHaveLength(2);
  expect(hybridQualificationWritePlan.filter((sample) => sample.actor === "judge-ui")).toHaveLength(12);
  expect(hybridQualificationWritePlan.filter((sample) => sample.actor === "api")).toHaveLength(130);
  const laterTeam = hybridEliminationSamples.filter((sample) => sample.teamSize === 3 && sample.selector === "later-stage-match-one-wave");
  expect(laterTeam).toHaveLength(2);
  expect(laterTeam.every((sample) => sample.stage === "medal")).toBe(true);
  expect(hybridEliminationWritePlan).toHaveLength(92);
  expect(hybridEliminationWritePlan.filter((sample) => sample.actor === "ui")).toHaveLength(21);
  expect(hybridEliminationWritePlan.filter((sample) => sample.actor === "api")).toHaveLength(71);
});

test("qualification resolver verifies session, approved role, group, player end and exact arrows", async () => {
  const { request } = fixture();
  await expect(assertApprovedScopedActor(request, actor)).resolves.toEqual({ userId: 4, participantId: 44 });
  await expect(resolveQualificationEnd(request, actor, { playerName: "Archer", endId: 31, endIndex: 0, requireCurrentQualificationEnd: true }))
    .resolves.toMatchObject({ groupId: 77, playerId: 55, endId: 31, scoreIds: [101, 102, 103, 104, 105, 106], qualificationCurrentEnd: 0 });
  await expect(resolveQualificationEnd(request, actor, { playerName: "Archer", endId: 999, endIndex: 0 })).rejects.toThrow("not ordinal");
  await expect(resolveQualificationEnd(request, actor, { playerName: "Archer", endId: 31, endIndex: 1, requireCurrentQualificationEnd: true })).rejects.toThrow("outside current end");
  await expect(assertApprovedScopedActor(fixture({ approved: false }).request, actor)).rejects.toThrow("not an approved");
  await expect(assertApprovedScopedActor(fixture({ username: "intruder" }).request, actor)).rejects.toThrow("not judge");
  await expect(assertApprovedScopedActor(fixture({ detailId: 99 }).request, actor)).rejects.toThrow("not judge");
});

test("failed qualification score write never attempts confirmation and valid write reads back", async () => {
  const bad = fixture({ scoreWriteStatus: 500 });
  const ref = await resolveQualificationEnd(bad.request, actor, { playerName: "Archer", endId: 31, endIndex: 0 });
  await expect(writeQualificationEnd("hybrid", bad.request, actor, ref, [10, 9, 8, 7, 6, 5])).rejects.toThrow("qualification score write failed");
  expect(bad.calls.some((call) => call.path === "/api/player/isconfirmed/31")).toBe(false);

  const good = fixture();
  const goodRef = await resolveQualificationEnd(good.request, actor, { playerName: "Archer", endId: 31, endIndex: 0 });
  await writeQualificationEnd("hybrid", good.request, actor, goodRef, [10, 9, 8, 7, 6, 5]);
  expect(good.calls.filter((call) => call.method === "PATCH").map((call) => call.data)).toEqual([
    { scores: [10, 9, 8, 7, 6, 5] }, { is_confirmed: true },
  ]);
});

test("elimination resolver binds active group/team/match, rejects malformed arrows, and reads back", async () => {
  const good = fixture();
  const ref = await resolveMatchEnd(good.request, actor, {
    teamSize: 1, playerSetName: "A1", opponentSetName: "A2", endId: 41, endIndex: 0,
  });
  expect(ref).toMatchObject({ eliminationId: 88, groupId: 77, stageId: 66, matchId: 65, scoreIds: [201, 307, 4_001] });
  await writeMatchEnd("hybrid", good.request, actor, ref, [10, 10, 9]);
  const scorePayload = good.calls.find((call) => call.path === "/api/matchresult/matchend/scores/41")?.data;
  expect(scorePayload).toEqual({ match_score_ids: [201, 307, 4_001], scores: [10, 10, 9] });
  expect(JSON.stringify(scorePayload)).not.toContain("total_scores");

  await expect(resolveMatchEnd(fixture({ duplicateScores: true }).request, actor, {
    teamSize: 1, playerSetName: "A1", opponentSetName: "A2", endId: 41, endIndex: 0,
  })).rejects.toThrow("duplicate score IDs");
  await expect(resolveMatchEnd(fixture().request, actor, {
    teamSize: 1, playerSetName: "A1", opponentSetName: "A2", endId: 41, endIndex: 1,
  })).rejects.toThrow("outside current end");
  await expect(writeMatchEnd("full-ui", good.request, actor, ref, [10, 10, 9])).rejects.toThrow("require ARCHERY_E2E_MODE=hybrid");
  await expect(writeMatchEnd("hybrid", good.request, actor, ref, [10, 10])).rejects.toThrow("match score count");

  const staleReadback = fixture({ readbackScores: [10, 8, 8] });
  const staleRef = await resolveMatchEnd(staleReadback.request, actor, {
    teamSize: 1, playerSetName: "A1", opponentSetName: "A2", endId: 41, endIndex: 0,
  });
  await expect(writeMatchEnd("hybrid", staleReadback.request, actor, staleRef, [10, 10, 9]))
    .rejects.toThrow("readback differs for its resolved score IDs");
});

test("API applicants isolate and dispose cookie contexts; approval preserves Player role", async () => {
  const state = { disposed: 0, applied: false, approved: false, created: false, failLogin: false, calls: [] as Array<{ path: string; data?: unknown }> };
  const participants = () => [{ id: 45, user_id: 4, role: "Player", status: state.approved ? "approved" : state.applied ? "pending" : "pending" }];
  const factory = {
    newContext: async () => ({
      get: async (path: string) => {
        if (path === "/api/user/me") return response(200, { id: 4 });
        if (path === "/api/user/4") return response(200, { id: 4, user_name: "archer" });
        if (path === "/api/participant/competition/9") return response(200, participants());
        if (path === "/api/competition/groups/players/9") return response(200, { groups: [{ players: state.created ? [{ participant_id: 45, name: "Archer" }] : [] }] });
        throw new Error(`unexpected GET ${path}`);
      },
      post: async (path: string, options?: { data?: unknown }) => {
        state.calls.push({ path, data: options?.data });
        if (path === "/api/session/") return response(state.failLogin ? 401 : 200);
        if (path === "/api/participant") { state.applied = true; return response(200, {}); }
        if (path === "/api/player/45") { state.created = true; return response(200, {}); }
        throw new Error(`unexpected POST ${path}`);
      },
      put: async (path: string) => {
        if (path === "/api/participant/45") { state.approved = true; return response(200, {}); }
        throw new Error(`unexpected PUT ${path}`);
      },
      patch: async () => response(500),
      dispose: async () => { state.disposed += 1; },
    }),
  };
  await expect(applyIndependentApiApplicant("full-ui", factory, { baseURL: "http://test", username: "archer", password: "pw", competitionId: 9 }))
    .rejects.toThrow("require ARCHERY_E2E_MODE=hybrid");
  await expect(applyIndependentApiApplicant("hybrid", factory, { baseURL: "http://test", username: "archer", password: "pw", competitionId: 9 }))
    .resolves.toEqual({ userId: 4, participantId: 45 });
  expect(state.calls).toEqual([
    { path: "/api/session/", data: { user_name: "archer", password: "pw" } },
    { path: "/api/participant", data: { competition_id: 9, role: "Player" } },
  ]);
  expect(state.disposed).toBe(1);

  const adminRequest: ApiRequest = {
    get: async (path) => path === "/api/user/me"
      ? response(200, { id: 9 })
      : path === "/api/user/9"
        ? response(200, { id: 9, user_name: "admin" })
      : path === "/api/competition/groups/players/9"
        ? response(200, { groups: [{ players: state.created ? [{ participant_id: 45, name: "Archer" }] : [] }] })
        : response(200, [{ id: 90, user_id: 9, role: "Admin", status: "approved" }, ...participants()]),
    post: async (path) => { expect(path).toBe("/api/player/45"); state.created = true; return response(200); },
    patch: async () => response(500),
    put: async (path, options) => {
      expect(path).toBe("/api/participant/45");
      expect(options?.data).toEqual({ status: "approved" });
      state.approved = true;
      return response(200);
    },
  };
  await approvePendingApiApplicant("hybrid", adminRequest, { role: "Admin", username: "admin", competitionId: 9, groupName: "A" }, { participantId: 45, applicantUserId: 4, expectedPlayerName: "Archer" });
  expect(state.approved).toBe(true);

  state.failLogin = true;
  await expect(applyIndependentApiApplicant("hybrid", factory, { baseURL: "http://test", username: "archer", password: "pw", competitionId: 9 })).rejects.toThrow("API login");
  expect(state.disposed).toBe(2);
});

test("qualification player lane batches are order-independent but reject wrong scope or payload", () => {
  const expected = [{ endId: 31, scores: [10, 10, 10, 10, 10, 10] }, { endId: 32, scores: [-1, -1, -1, -1, -1, -1] }];
  expect(() => assertQualificationBatchPatches(expected, [
    { endId: 32, status: 200, scores: [-1, -1, -1, -1, -1, -1] },
    { endId: 31, status: 200, scores: [10, 10, 10, 10, 10, 10] },
  ])).not.toThrow();
  expect(() => assertQualificationBatchPatches(expected, [
    { endId: 31, status: 200, scores: [10, 10, 10, 10, 10, 10] },
    { endId: 99, status: 200, scores: [-1, -1, -1, -1, -1, -1] },
  ])).toThrow("outside lane scope");
  expect(() => assertQualificationBatchPatches(expected, [
    { endId: 31, status: 200, scores: [10, 10, 10, 10, 10, 10] },
    { endId: 32, status: 200, scores: [0, -1, -1, -1, -1, -1] },
  ])).toThrow("wrong payload");
});

test("current team match resolver distinguishes both sides, six-arrow IDs, and invalid scope", async () => {
  const good = teamFixture();
  const left = await resolveCurrentMatchEnd(good.request, actor, { teamSize: 3, matchIndex: 0, side: 1 });
  const right = await resolveCurrentMatchEnd(good.request, actor, { teamSize: 3, matchIndex: 0, side: 2 });
  expect(left).toMatchObject({ matchResultId: 64, endId: 71, scoreIds: [101, 202, 303, 404, 505, 606] });
  expect(right).toMatchObject({ matchResultId: 63, endId: 72, scoreIds: [107, 208, 309, 410, 511, 612] });
  await writeMatchEnd("hybrid", good.request, actor, right, [10, 10, 10, 10, 10, 9]);
  expect(good.calls.find((call) => call.path === "/api/matchresult/matchend/scores/72")?.data)
    .toEqual({ match_score_ids: [107, 208, 309, 410, 511, 612], scores: [10, 10, 10, 10, 10, 9] });
  await expect(resolveCurrentMatchEnd(good.request, actor, { teamSize: 3, matchIndex: 1, side: 1 })).rejects.toThrow("match 2");
  await expect(resolveMatchEnd(good.request, actor, { teamSize: 3, playerSetName: "Team A", opponentSetName: "Team B", endId: 999, endIndex: 0 })).rejects.toThrow("active");
  await expect(resolveCurrentMatchEnd(teamFixture({ wrongGroup: true }).request, actor, { teamSize: 3, matchIndex: 0, side: 1 })).rejects.toThrow("does not belong");
});
