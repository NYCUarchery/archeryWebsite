import { ToggleButtonGroup, ToggleButton, Box, Typography } from "@mui/material";
import ScoreBlock from "@/components/ScoreBlock";
import { LocalMatchResult } from "./eliminationScoringSlice";

interface Props {
  matchResults: LocalMatchResult[];
  selectedMatchResultIdentifier: number;
  onSelect: (matchResultId: number) => void;
}

// 仿資格賽 ToggleButtonGroup + PlayerInfoBar：於雙方 MatchResult 間切換（value = matchResultId），
// 鈕內直接以 ScoreBlock 呈現本波各箭分數與波總分。確認狀態由下方 ControllButtonGroup 顯示，此處不重覆。
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
      sx={{ mt: 1, mb: 1, alignItems: "stretch" }}
    >
      {matchResults.map((mr) => (
        <ToggleButton
          className="match_result_button"
          key={mr.matchResultId}
          value={mr.matchResultId}
          sx={{ alignItems: "start", py: 1 }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div className="name_bar">{mr.setName || "未命名"}</div>
            {mr.memberNames.length > 1 && (
              <Box sx={{ fontSize: 12 }}>{mr.memberNames.join("、")}</Box>
            )}
            <Typography className="match_total_score" variant="h6">
              {mr.totalScores}
            </Typography>
            <Box
              className="match_score_bar"
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {mr.scores.map((s) => (
                <ScoreBlock key={s.id} score={s.score} />
              ))}
            </Box>
          </Box>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
