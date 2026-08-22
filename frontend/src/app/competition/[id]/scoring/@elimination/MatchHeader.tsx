import { Box } from "@mui/material";
import LaneNumber from "@/components/LaneNumber";
import { DatabaseMatchResult } from "@/types/Api";

interface Props {
  groupName: string;
  teamSize: number;
  stageIndex: number; // elimination.current_stage（0-based）
  endIndex: number; // currentEndIndex（0-based）
  matchResults: DatabaseMatchResult[]; // 供取雙方 lane_number
}

// 依隊伍規模換算顯示用類型名稱。
function teamSizeLabel(teamSize: number): string {
  switch (teamSize) {
    case 1:
      return "個人賽";
    case 3:
      return "團體賽";
    case 2:
      return "混雙賽";
    default:
      return "對抗賽";
  }
}

export default function MatchHeader({
  groupName,
  teamSize,
  stageIndex,
  endIndex,
  matchResults,
}: Props) {
  return (
    <Box sx={{ textAlign: "center", color: "primary.main", mb: 1 }}>
      <div>
        {groupName} - {teamSizeLabel(teamSize)}
      </div>
      <div>
        第 {stageIndex + 1} 輪 / 第 {endIndex + 1} 局
      </div>
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 1 }}>
        {matchResults.map((mr) => (
          <LaneNumber
            key={mr.id}
            laneNumber={mr.lane_number}
            width="30px"
            height="30px"
          />
        ))}
      </Box>
    </Box>
  );
}
