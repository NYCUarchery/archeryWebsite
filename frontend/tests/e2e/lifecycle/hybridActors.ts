import type { APIRequest, APIRequestContext } from "@playwright/test";
import { assertHybridApiWriteAllowed, type LifecycleExecutionMode } from "./execution";
import { assertApprovedScopedActor, readAuthenticatedUser, type ApiRequest, type ApiResponse, type ScopedActor } from "./formalApi";

type ApiRequestFactory = Pick<APIRequest, "newContext">;
type ApiContext = ApiRequest & { dispose(): Promise<void> };
type Participant = { id?: number; user_id?: number; role?: string; status?: string };

function positiveId(value: number | undefined, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive ID`);
  return value;
}

async function json<T>(response: ApiResponse, operation: string): Promise<T> {
  if (!response.ok()) throw new Error(`${operation} failed with HTTP ${response.status()}`);
  return await response.json() as T;
}

async function loginIndependentContext(
  requestFactory: ApiRequestFactory,
  baseURL: string,
  username: string,
  password: string,
): Promise<ApiContext> {
  const request = await requestFactory.newContext({ baseURL }) as APIRequestContext as ApiContext;
  try {
    const login = await request.post("/api/session/", { data: { user_name: username, password } });
    if (!login.ok()) throw new Error(`API login for ${username} failed with HTTP ${login.status()}`);
    await readAuthenticatedUser(request, username);
    return request;
  } catch (error) {
    await request.dispose();
    throw error;
  }
}

/**
 * One unapproved Player application in its own cookie jar. It always disposes
 * the context: CP2 uses the already approved Judge session for score API calls.
 */
export async function applyIndependentApiApplicant(
  mode: LifecycleExecutionMode,
  requestFactory: ApiRequestFactory,
  input: { baseURL: string; username: string; password: string; competitionId: number },
): Promise<{ userId: number; participantId: number }> {
  assertHybridApiWriteAllowed(mode);
  const request = await loginIndependentContext(requestFactory, input.baseURL, input.username, input.password);
  try {
    const userId = await readAuthenticatedUser(request, input.username);
    await json<unknown>(await request.post("/api/participant", { data: { competition_id: input.competitionId, role: "Player" } }), "Player application");
    const participants = await json<Participant[]>(
      await request.get(`/api/participant/competition/${input.competitionId}`),
      "application readback",
    );
    const participant = participants.find((candidate) => candidate.user_id === userId);
    if (!participant || participant.role !== "Player" || participant.status !== "pending") {
      throw new Error(`${input.username} application was not pending Player`);
    }
    return { userId, participantId: positiveId(participant.id, "pending participant") };
  } finally {
    await request.dispose();
  }
}

/** Admin approval mirrors its UI workflow, including exactly one Player creation. */
export async function approvePendingApiApplicant(
  mode: LifecycleExecutionMode,
  request: ApiRequest,
  admin: ScopedActor,
  input: { participantId: number; applicantUserId: number; expectedPlayerName: string },
) {
  assertHybridApiWriteAllowed(mode);
  if (admin.role !== "Admin") throw new Error("participant approval requires an Admin actor");
  await assertApprovedScopedActor(request, admin);
  const participants = await json<Participant[]>(
    await request.get(`/api/participant/competition/${admin.competitionId}`),
    "pending application lookup",
  );
  const pending = participants.find((participant) => participant.id === input.participantId && participant.user_id === input.applicantUserId);
  if (!pending || pending.role !== "Player" || pending.status !== "pending") throw new Error("target is not a pending Player application");
  await json<unknown>(await request.put(`/api/participant/${input.participantId}`, { data: { status: "approved" } }), "Player approval");
  const after = await json<Participant[]>(
    await request.get(`/api/participant/competition/${admin.competitionId}`),
    "approval readback",
  );
  const approved = after.find((participant) => participant.id === input.participantId);
  if (!approved || approved.user_id !== input.applicantUserId || approved.role !== "Player" || approved.status !== "approved") {
    throw new Error("Player approval readback differs");
  }
  const beforeRoster = await json<{ groups?: Array<{ players?: Array<{ participant_id?: number }> }> }>(
    await request.get(`/api/competition/groups/players/${admin.competitionId}`),
    "Player creation precondition lookup",
  );
  if (beforeRoster.groups?.flatMap((group) => group.players ?? []).some((player) => player.participant_id === input.participantId)) {
    throw new Error("approved Player already has a Player record");
  }
  await json<unknown>(await request.post(`/api/player/${input.participantId}`), "Player creation");
  const afterRoster = await json<{ groups?: Array<{ players?: Array<{ participant_id?: number; name?: string }> }> }>(
    await request.get(`/api/competition/groups/players/${admin.competitionId}`),
    "Player creation readback",
  );
  const created = afterRoster.groups?.flatMap((group) => group.players ?? []).filter((player) => player.participant_id === input.participantId) ?? [];
  if (created.length !== 1 || created[0]?.name !== input.expectedPlayerName) throw new Error("Player creation readback differs");
}
