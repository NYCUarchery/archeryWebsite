import { Box, Divider, Grid } from "@mui/material";
import PlayerLight from "./PlayerLight";
interface Props {
  index: number;
  playerNum: number;
}

export default function LaneBlock({ index, playerNum }: Props) {
  let playerLights = [];

  for (let i = 0; i < playerNum; i++) {
    let isConfirmed = Math.random() > 0.5;

    playerLights.push(
      <PlayerLight
        laneIndex={index}
        order={i}
        isConfirmed={isConfirmed}
      ></PlayerLight>
    );
  }

  return (
    <Grid
      item
      xs={2}
      sx={{
        border: "1px solid #d5d7dc",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "30px",
          fontSize: "15px",
          display: "flex",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Lane {index}
      </Box>
      <Divider />
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: "30px",
          justifyContent: "space-evenly",
          alignItems: "center",
        }}
      >
        {playerLights}
      </Box>
    </Grid>
  );
}
