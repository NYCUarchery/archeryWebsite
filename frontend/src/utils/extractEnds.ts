import {
  EndpointPutPlayerAllEndScoresByEndIdEndScores,
  DatabaseRoundEnd,
} from "@/types/Api";

export interface EndToPatch {
  id: number;
  scores: EndpointPutPlayerAllEndScoresByEndIdEndScores;
}

export function extractEnds(ends: DatabaseRoundEnd[]): EndToPatch[] {
  const endsToPatch: EndToPatch[] = [];
  for (const end of ends) {
    const scores = end.round_scores!.map((score) => score.score!);
    endsToPatch.push({
      id: end.id!,
      scores: { scores: scores },
    });
  }
  return endsToPatch;
}
