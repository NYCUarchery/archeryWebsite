/**
 * Lifecycle write strategy. CP1 deliberately defaults to the proven UI-only
 * path. API writers are opt-in and may only be called by the hybrid plan.
 */
export type LifecycleExecutionMode = "full-ui" | "hybrid";
export type HybridGroup = "recurve" | "compound";

export function parseLifecycleExecutionMode(value = process.env.ARCHERY_E2E_MODE): LifecycleExecutionMode {
  if (value === undefined || value === "") return "full-ui";
  if (value === "full-ui" || value === "hybrid") return value;
  throw new Error(`ARCHERY_E2E_MODE must be "full-ui" or "hybrid", got ${JSON.stringify(value)}`);
}

/** Reject an accidental API write while running the full UI control path. */
export function assertHybridApiWriteAllowed(mode: LifecycleExecutionMode): asserts mode is "hybrid" {
  if (mode !== "hybrid") throw new Error("formal API writes require ARCHERY_E2E_MODE=hybrid");
}

export type HybridQualificationSample = {
  group: HybridGroup;
  actor: "player-ui" | "judge-ui" | "api";
  archerIndex: number;
  ends: readonly number[];
};

/** Fixed UI subset; every omitted (archer,end) is selected by the API selector. */
export const hybridQualificationSamples: readonly HybridQualificationSample[] = [
  { group: "recurve", actor: "player-ui", archerIndex: 1, ends: [0] },
  { group: "compound", actor: "player-ui", archerIndex: 13, ends: [0] },
  { group: "recurve", actor: "judge-ui", archerIndex: 2, ends: [0, 1, 2, 3, 4, 5] },
  { group: "compound", actor: "judge-ui", archerIndex: 14, ends: [0, 1, 2, 3, 4, 5] },
] as const;

export function qualificationWriteActor(archerIndex: number, endIndex: number): HybridQualificationSample["actor"] {
  if (![0, 1, 2, 3, 4, 5].includes(endIndex) || archerIndex < 1 || archerIndex > 24) throw new Error("qualification selector is outside the 24x6 fixture");
  if ((archerIndex === 1 || archerIndex === 13) && endIndex === 0) return "player-ui";
  if (archerIndex === 2 || archerIndex === 14) return "judge-ui";
  return "api";
}

/** Exhaustive, deterministic 24 archers × 6 ends selection table. */
export const hybridQualificationWritePlan = Array.from({ length: 24 }, (_, index) =>
  Array.from({ length: 6 }, (_, endIndex) => ({
    archerIndex: index + 1,
    endIndex,
    group: index < 12 ? "recurve" : "compound" as HybridGroup,
    actor: qualificationWriteActor(index + 1, endIndex),
  })),
).flat();

export type HybridEliminationSample = {
  group: HybridGroup;
  teamSize: 1 | 3;
  selector: "first-match-all-waves" | "later-stage-match-one-wave";
  stage: "first" | "semi-final" | "medal";
  matchIndex: 0;
  waves: "all" | readonly [0];
};

/** Every event retains Match 1 UI writes in first and later stages, team included. */
export const hybridEliminationSamples: readonly HybridEliminationSample[] = [
  { group: "recurve", teamSize: 1, selector: "first-match-all-waves", stage: "first", matchIndex: 0, waves: "all" },
  { group: "compound", teamSize: 3, selector: "first-match-all-waves", stage: "first", matchIndex: 0, waves: "all" },
  { group: "compound", teamSize: 1, selector: "first-match-all-waves", stage: "first", matchIndex: 0, waves: "all" },
  { group: "recurve", teamSize: 3, selector: "first-match-all-waves", stage: "first", matchIndex: 0, waves: "all" },
  { group: "recurve", teamSize: 1, selector: "later-stage-match-one-wave", stage: "semi-final", matchIndex: 0, waves: [0] },
  { group: "compound", teamSize: 1, selector: "later-stage-match-one-wave", stage: "semi-final", matchIndex: 0, waves: [0] },
  { group: "recurve", teamSize: 1, selector: "later-stage-match-one-wave", stage: "medal", matchIndex: 0, waves: [0] },
  { group: "compound", teamSize: 1, selector: "later-stage-match-one-wave", stage: "medal", matchIndex: 0, waves: [0] },
  { group: "recurve", teamSize: 3, selector: "later-stage-match-one-wave", stage: "medal", matchIndex: 0, waves: [0] },
  { group: "compound", teamSize: 3, selector: "later-stage-match-one-wave", stage: "medal", matchIndex: 0, waves: [0] },
] as const;
