import { Alert, Box, Button, Typography } from "@mui/material";
import type { LocalMatchResult } from "./eliminationScoringSlice";
import type { EliminationMatchData } from "./useCurrentEliminationMatch";
import MatchHeader from "./MatchHeader";
import MatchResultSelector from "./MatchResultSelector";

interface Props {
  data: EliminationMatchData;
  matchResults: LocalMatchResult[];
  selectedMatchResultIdentifier: number;
  confirmationEndIndex?: number;
  isBusy: boolean;
  hasUnsavedChanges: boolean;
  onSelect: (id: number) => void;
  onConfirm: () => void;
}

export default function ClosedEliminationScoringBoard({
  data, matchResults, selectedMatchResultIdentifier, confirmationEndIndex,
  isBusy, hasUnsavedChanges, onSelect, onConfirm,
}: Props) {
  const selected = matchResults.find((result) => result.matchResultId === selectedMatchResultIdentifier);
  const winner = data.matchResults.find((result) => result.is_winner);
  const winnerName = data.elimination.player_sets?.find((set) => set.id === winner?.player_set_id)?.set_name ?? "未命名";

  return (
    <Box className="elimination_board">
      <Alert severity="success">本場對抗已結束</Alert>
      <Typography sx={{ my: 1 }}>勝者：{winnerName}</Typography>
      {hasUnsavedChanges && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          本場已結束，尚未儲存的修改未送出；以下為伺服器已儲存比分。
        </Alert>
      )}
      <MatchHeader
        stageIndex={data.elimination.current_stage ?? 0}
        endIndex={confirmationEndIndex ?? data.currentEndIndex}
        matchResults={data.matchResults}
      />
      <MatchResultSelector
        matchResults={matchResults}
        totalLabel="總積點"
        matchTotals={Object.fromEntries(data.matchResults.map((result) => [result.id, result.total_points]))}
        selectedMatchResultIdentifier={selectedMatchResultIdentifier}
        onSelect={onSelect}
      />
      {confirmationEndIndex !== undefined && selected && (
        <Button
          fullWidth
          variant="contained"
          disabled={isBusy || selected.isConfirmed}
          onClick={onConfirm}
        >
          {selected.isConfirmed ? "已確認" : "確認本波"}
        </Button>
      )}
    </Box>
  );
}
