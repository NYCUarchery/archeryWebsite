import { Box } from "@mui/material";
import LaneNumber from "@/components/LaneNumber";
import { DatabaseMatchResult } from "@/types/Api";

interface Props {
  stageIndex: number; // elimination.current_stage（0-based）
  endIndex: number; // currentEndIndex（0-based）
  matchResults: DatabaseMatchResult[]; // 供取雙方 lane_number
}

// 組別與賽制已由上方 GroupPhaseTag 顯示，此處只顯示輪次／波次與靶道。
export default function MatchHeader({
  stageIndex,
  endIndex,
  matchResults,
}: Props) {
  return (
    <Box sx={{ textAlign: "center", color: "primary.main", mb: 1 }}>
      <div>
        第 {stageIndex + 1} 輪 / 第 {endIndex + 1} 波
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
