import { ToggleButtonGroup, ToggleButton, Box } from "@mui/material";
import { LocalMatchResult } from "./eliminationScoringSlice";

interface Props {
  matchResults: LocalMatchResult[];
  selectedMatchResultIdentifier: number;
  onSelect: (matchResultId: number) => void;
}

// 仿資格賽 ToggleButtonGroup，於雙方 MatchResult 間切換（value = matchResultId）。
export default function MatchResultSelector({
  matchResults,
  selectedMatchResultIdentifier,
  onSelect,
}: Props) {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: number | null
  ) => {
    // exclusive 模式下再次點擊已選中鈕會回傳 null，此時維持原選中狀態不變。
    if (newValue === null) return;
    onSelect(newValue);
  };

  return (
    <ToggleButtonGroup
      className="match_result_button_group"
      color="info"
      fullWidth
      exclusive
      value={selectedMatchResultIdentifier}
      onChange={handleChange}
      sx={{ mt: 1, mb: 1 }}
    >
      {matchResults.map((mr) => (
        <ToggleButton key={mr.matchResultId} value={mr.matchResultId}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span>{mr.setName || "未命名"}</span>
            <span>{mr.isConfirmed ? "已確認" : "未確認"}</span>
          </Box>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
