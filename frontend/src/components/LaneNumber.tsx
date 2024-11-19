import { Box } from "@mui/material";

interface LaneNumberProps {
  laneNumber?: number;
  width: string;
  height: string;
}

function LaneNumber({ laneNumber, width, height }: LaneNumberProps) {
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
        {laneNumber}
      </span>
    </Box>
  );
}

export default LaneNumber;
