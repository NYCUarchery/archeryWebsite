import { Box } from "@mui/material";
import { LocalMatchResult } from "./eliminationScoringSlice";

interface Props {
  matchResult: LocalMatchResult;
}

// 把單一箭分數轉為顯示用文字：11→X、0→M、其餘照原值、-1（未填）→ "-"。
function scoreLabel(score: number): string {
  if (score === -1) return "-";
  if (score === 11) return "X";
  if (score === 0) return "M";
  return String(score);
}

// 選中側之 setName、成員名單、目前局箭值（DESC）、局總分、確認狀態。
export default function MatchResultSummary({ matchResult }: Props) {
  return (
    <Box sx={{ textAlign: "center", mt: 1, mb: 1 }}>
      <div>{matchResult.setName || "未命名"}</div>
      {matchResult.memberNames.length > 1 && (
        <div>{matchResult.memberNames.join("、")}</div>
      )}
      <div>
        本局箭值：
        {matchResult.scores.map((s) => scoreLabel(s.score)).join(" / ")}
      </div>
      <div>局總分：{matchResult.totalScores}</div>
      <div>{matchResult.isConfirmed ? "本局已確認" : "本局尚未確認"}</div>
    </Box>
  );
}
