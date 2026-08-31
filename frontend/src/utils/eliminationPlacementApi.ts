import type {
  EndpointMatchPlacementRequest,
  EndpointStagePlacementRequest,
} from "@/types/Api";
import { apiClient } from "@/utils/ApiClient";
import { MatchPlacement } from "./eliminationPlacement";

export function createEliminationBracket(
  eliminationId: number,
  advancingCount: number
) {
  return apiClient.elimination.bracketCreate(eliminationId, {
    advancing_count: advancingCount,
  });
}

export function placeEliminationStage(
  stageId: number,
  data: EndpointStagePlacementRequest
) {
  return apiClient.elimination.stagePlacementUpdate(stageId, data);
}

export function placeEliminationMatch(matchId: number, placements: MatchPlacement[]) {
  const request: EndpointMatchPlacementRequest = { placements };
  return apiClient.elimination.matchPlacementUpdate(matchId, request);
}
