import { Box, Divider, Grid } from "@mui/material";
import ScoreBlock from "./ScoreBlock";
import { EndStats } from "@/utils/calculatePlayerStatistics";

interface Props {
  end: EndStats;
}

export default function EndBar({ end }: Props) {
  const scores = end.scores.map((score, index) => {
    return (
      <Grid
        item
        xs={1}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
        key={index}
      >
        <ScoreBlock score={score} />
      </Grid>
    );
  });

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "30px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "80%",
        }}
      >
        <Grid container columns={6}>
          {scores}
        </Grid>
      </Box>
      <Divider orientation="vertical" flexItem variant="middle" />
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "20%",
        }}
      >
        {end.totalScore}
      </Box>
    </Box>
  );
}
