import { Box, Grid } from "@mui/material";
import PlayerPicker from "./PlayerPicker";

export default function QualificationPenal() {
  return (
    <Box>
      <Grid container>
        <Grid item xs={3}>
          <PlayerPicker />
        </Grid>
      </Grid>
    </Box>
  );
}
