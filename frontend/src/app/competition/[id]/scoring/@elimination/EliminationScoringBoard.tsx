import { Box } from "@mui/material";
import ScoreController from "@/components/ScoreController/ScoreController";
import MatchHeader from "./MatchHeader";
import MatchResultSelector from "./MatchResultSelector";
import MatchResultSummary from "./MatchResultSummary";
import { LocalMatchResult } from "./eliminationScoringSlice";
import { EliminationMatchData } from "./useCurrentEliminationMatch";

// 12 種可能分數：X(11)/10..1/M(0)。
const POSSIBLE_SCORES = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

interface Props {
  data: EliminationMatchData; // useCurrentEliminationMatch ready 之原始資料（供 lane_number 等）
  matchResults: LocalMatchResult[]; // slice 內雙方目前局視圖
  selectedMatchResultIdentifier: number;
  isSaving: boolean;
  onSelectMatchResult: (matchResultId: number) => void;
  onAddScore: (score: number) => void;
  onDeleteScore: () => void;
  onSave: () => void;
  onConfirm: () => void;
}

// 組 MatchHeader + MatchResultSelector + 選中側 MatchResultSummary + ScoreController（泛型）。
export default function EliminationScoringBoard({
  data,
  matchResults,
  selectedMatchResultIdentifier,
  isSaving,
  onSelectMatchResult,
  onAddScore,
  onDeleteScore,
  onSave,
  onConfirm,
}: Props) {
  const selected = matchResults.find(
    (mr) => mr.matchResultId === selectedMatchResultIdentifier
  );

  return (
    <Box className="elimination_board">
      <MatchHeader
        groupName={data.group.group_name ?? "未命名組別"}
        teamSize={data.teamSize}
        stageIndex={data.elimination.current_stage ?? 0}
        endIndex={data.currentEndIndex}
        matchResults={data.matchResults}
      />
      <MatchResultSelector
        matchResults={matchResults}
        selectedMatchResultIdentifier={selectedMatchResultIdentifier}
        onSelect={onSelectMatchResult}
      />
      {selected ? (
        <>
          <MatchResultSummary matchResult={selected} />
          <ScoreController
            scores={selected.scores.map((s) => s.score)}
            isConfirmed={selected.isConfirmed}
            maximumArrowCount={selected.capacity}
            possibleScores={POSSIBLE_SCORES}
            onAddScore={onAddScore}
            onDeleteScore={onDeleteScore}
            onSave={onSave}
            onConfirm={onConfirm}
            isSaving={isSaving}
          />
        </>
      ) : (
        <p>找不到選中的對局資料。</p>
      )}
    </Box>
  );
}
