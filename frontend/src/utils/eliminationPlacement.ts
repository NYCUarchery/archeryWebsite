import type { DatabaseMatchResult } from "@/types/Api";

export type MatchTarget = "A" | "B" | null;

export function getMatchResultTarget(result?: DatabaseMatchResult): MatchTarget {
  const target = result?.target;
  return target === "A" || target === "B" ? target : null;
}

export function formatLanePlacement(
  laneNumber?: number,
  target: MatchTarget = null
) {
  if (!laneNumber || laneNumber < 1) return "";
  return `${laneNumber}${target ?? ""}`;
}

export interface MatchPlacement {
  match_result_id: number;
  lane_number: number;
  target: MatchTarget;
}

export function isValidMatchPlacement(placements: MatchPlacement[]) {
  if (placements.length !== 2) return false;
  const [left, right] = placements;
  if (
    left.match_result_id <= 0 ||
    right.match_result_id <= 0 ||
    left.match_result_id === right.match_result_id
  ) {
    return false;
  }

  return placements.every(
    ({ lane_number, target }) =>
      Number.isInteger(lane_number) &&
      lane_number >= 0 &&
      (target === null || target === "A" || target === "B")
  );
}

export function requiredTargetCount(
  matchCount: number,
  mode: "one_player_set_per_target" | "two_player_sets_per_target"
) {
  return matchCount * (mode === "one_player_set_per_target" ? 2 : 1);
}
