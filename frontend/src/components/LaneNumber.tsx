import { Box } from "@mui/material";
import { MatchTarget, formatLanePlacement } from "@/utils/eliminationPlacement";

interface LaneNumberProps {
  laneNumber?: number;
  target?: MatchTarget;
  width: string;
  height: string;
}

function LaneNumber({ laneNumber, target = null, width, height }: LaneNumberProps) {
  let color = "#fff700";
  let backgroundColor = "black";
  if (laneNumber != undefined && laneNumber % 2 == 1) {
    color = "black";
    backgroundColor = "#fff700";
  }

  return (
    <Box
      sx={{
        width,
        height,
        backgroundColor,
        color,
        display: "flex",
        justifyContent: "center",
        alignContent: "center",
      }}
    >
      <span
        style={{
          fontSize: "20px",
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: height,
        }}
      >
        {formatLanePlacement(laneNumber, target)}
      </span>
    </Box>
  );
}

export default LaneNumber;
