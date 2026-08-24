import { DatabasePlayerSet, DatabaseStage } from "@/types/Api";

export function nextPowerOfTwo(value: number) {
  if (value < 1) return 0;
  return 2 ** Math.ceil(Math.log2(value));
}

export function hasContinuousRanks(playerSets: DatabasePlayerSet[]) {
  return playerSets.every((playerSet, index) => playerSet.rank === index + 1);
}

// 完整樹為 m,m/2,...,2；末階另有金、銅兩場，故 m=2 時為 [2,2]。
export function isCompleteEliminationBracket(stages: DatabaseStage[] | undefined) {
  if (!stages || stages.length < 2) return false;

  const firstStageMatchCount = stages[0]?.matchs?.length ?? 0;
  if (
    firstStageMatchCount < 2 ||
    !Number.isInteger(Math.log2(firstStageMatchCount))
  ) {
    return false;
  }

  const expectedStageCount = Math.log2(firstStageMatchCount) + 1;
  if (stages.length !== expectedStageCount) return false;

  return stages.every((stage, index) => {
    const expectedMatchCount =
      index === stages.length - 1 ? 2 : firstStageMatchCount / 2 ** index;
    return (
      stage.matchs?.length === expectedMatchCount &&
      stage.matchs.every((match) => match.match_results?.length === 2)
    );
  });
}
