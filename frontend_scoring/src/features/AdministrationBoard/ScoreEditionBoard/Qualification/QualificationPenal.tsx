import { Box, Grid } from "@mui/material";
import PlayerPicker from "./PlayerPicker";

import ScoreBoard from "./ScoreBoard/ScoreBoard";
import { useState } from "react";

export default function QualificationPenal() {
  const [selectedPlayerId, setSelectedPlayerId] = useState(0);
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={2}>
          <PlayerPicker setSelectedPlayerId={setSelectedPlayerId} />
        </Grid>
        <Grid item xs={10}>
          <ScoreBoard selectedPlayerId={selectedPlayerId} />
        </Grid>
      </Grid>
    </Box>
  );
}
