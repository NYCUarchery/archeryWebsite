import { Grid, ListItem, Box } from "@mui/material";
import EndLight from "./EndLight";

interface Props {
  index: number;
}

export default function RoundBlock({ index }: Props) {
  let endLights = [];

  for (let i = 0; i < 6; i++) {
    let endLightIndex = index * 6 + i;
    let currentEnd = 8;
    let status = "ended" as "ended" | "ongoing" | "upcoming";

    if (endLightIndex < currentEnd) {
      status = "ended";
    } else if (endLightIndex == currentEnd) {
      status = "ongoing";
    } else if (endLightIndex > currentEnd) {
      status = "upcoming";
    }

    endLights.push(
      <EndLight key={endLightIndex} index={endLightIndex} status={status} />
    );
  }

  return (
    <ListItem
      sx={{
        display: "block",
      }}
    >
      <Box sx={{ width: "100%", height: "30px" }}>Round {index + 1}</Box>
      <Grid container spacing={0}>
        {endLights}
      </Grid>
    </ListItem>
  );
}
