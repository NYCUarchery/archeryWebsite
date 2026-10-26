import type { DatabaseMatchResult } from "@/types/Api";

/** Locate the saved regulation end to confirm, even after progress moves on. */
export function recurveClosingEnd(
  results: DatabaseMatchResult[],
  teamSize: number,
): number | undefined {
  if (results.length !== 2) return undefined;
  const arrows = teamSize === 1 ? 3 : teamSize === 2 ? 4 : teamSize === 3 ? 6 : 0;
  if (!arrows) return undefined;
  const winningPoints = teamSize === 1 ? 6 : 5;
  const waves = teamSize === 1 ? 5 : 4;
  let lastComplete: number | undefined;
  for (let index = 0; index < waves; index++) {
    const ends = results.map((result) => result.match_ends?.[index]);
    if (!ends.every((end) =>
      end?.id !== undefined && end.match_scores?.length === arrows &&
      end.match_scores.every(({ score }) =>
        score !== undefined && Number.isInteger(score) && score >= 0 && score <= 11
      )
    )) break;
    lastComplete = index;
    if (ends.some((end) => (end?.cumulative_points ?? 0) >= winningPoints)) {
      return index;
    }
  }
  // A manually selected winner may have no score-derived winning end.
  return lastComplete;
}
