import type { DatabaseMatchEnd, DatabaseMatchResult } from "@/types/Api";

/** 後端同時接受正式英文值與既有中文弓種值。 */
export function isCompoundBowType(bowType?: string): boolean {
  return bowType === "Compound" || bowType === "複合弓";
}

function matchEndScore(end: DatabaseMatchEnd): number {
  if (end.total_scores !== undefined) return end.total_scores;
  return (end.match_scores ?? []).reduce(
    (total, score) =>
      total + (score.score === 11 ? 10 : score.score !== undefined && score.score >= 0 ? score.score : 0),
    0,
  );
}

/** 複合弓淘汰賽以全部波次的箭分加總判勝。 */
export function totalMatchScore(matchResult?: DatabaseMatchResult): number | undefined {
  const ends = matchResult?.match_ends;
  if (!ends?.length) return undefined;
  return ends.reduce((total, end) => total + matchEndScore(end), 0);
}
