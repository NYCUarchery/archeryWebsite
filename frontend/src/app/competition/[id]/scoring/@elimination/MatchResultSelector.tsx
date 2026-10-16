import { ToggleButtonGroup, ToggleButton, Box, Typography } from "@mui/material";
import ScoreBlock from "@/components/ScoreBlock";
import { LocalMatchResult } from "./eliminationScoringSlice";

interface Props {
  matchResults: LocalMatchResult[];
  totalLabel: string;
  matchTotals: Record<number, number | undefined>;
  selectedMatchResultIdentifier: number;
  onSelect: (matchResultId: number) => void;
}

const SEGMENT_POINTS = {
  a: "6,0 26,0 30,4 26,8 6,8 2,4",
  b: "28,6 32,10 32,26 28,30 24,26 24,10",
  c: "28,32 32,36 32,52 28,56 24,52 24,36",
  d: "6,54 26,54 30,58 26,62 6,62 2,58",
  e: "4,32 8,36 8,52 4,56 0,52 0,36",
  f: "4,6 8,10 8,26 4,30 0,26 0,10",
  g: "6,27 26,27 30,31 26,35 6,35 2,31",
};
const DIGIT_SEGMENTS: Record<string, string> = {
  "0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg",
  "5": "acdfg", "6": "acdefg", "7": "abc", "8": "abcdefg", "9": "abcdfg",
  "—": "g",
};

function SevenSegmentTotal({ value, label }: { value?: number; label: string }) {
  const digits = String(value ?? "—");
  return (
    <Box
      component="svg"
      className="match_total"
      role="img"
      aria-label={`${label}：${digits}`}
      focusable="false"
      viewBox={`0 0 ${digits.length * 36 + 12} 74`}
      sx={{ width: digits.length * 26 + 16, height: 56, minWidth: 46, maxWidth: "100%", my: 0.5, bgcolor: "#000", color: "#fff700", borderRadius: 0.75 }}
    >
      {[...digits].map((digit, index) => (
        <g key={index} data-digit={digit} transform={`translate(${6 + index * 36} 6)`}>
          {Object.entries(SEGMENT_POINTS).map(([segment, points]) => (
            <polygon key={segment} points={points} fill="currentColor" opacity={DIGIT_SEGMENTS[digit].includes(segment) ? 1 : 0.12} />
          ))}
        </g>
      ))}
    </Box>
  );
}

// 仿資格賽 ToggleButtonGroup + PlayerInfoBar：於雙方 MatchResult 間切換（value = matchResultId），
// 鈕內直接以 ScoreBlock 呈現本波各箭分數與波總分。確認狀態由下方 ControllButtonGroup 顯示，此處不重覆。
export default function MatchResultSelector({
  matchResults,
  totalLabel,
  matchTotals,
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
          sx={{ alignItems: "start", py: 1, flex: 1, minWidth: 0 }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              minWidth: 0,
              overflowWrap: "anywhere",
            }}
          >
            <div className="name_bar">{mr.setName || "未命名"}</div>
            <SevenSegmentTotal value={matchTotals[mr.matchResultId]} label={totalLabel} />
            {mr.memberNames.length > 1 && (
              <Box sx={{ fontSize: 12 }}>{mr.memberNames.join("、")}</Box>
            )}
            <Typography className="match_total_score" variant="h6" sx={{ color: "gray" }}>
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
