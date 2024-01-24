import { Box, Divider, Grid } from "@mui/material";
import { RoundEnd } from "../../../../../QueryHooks/types/Player";
import ScoreBlock from "./ScoreBlock";

interface Props {
  end: RoundEnd;
}

export default function EndBar({ end }: Props) {
  const scores = end.round_scores.map((roundScore) => {
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
      >
        <ScoreBlock score={roundScore.score} />
      </Grid>
    );
  });

  const endScore = getEndScore(end);
  if (endScore === -1) return <></>;

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
        {endScore}
      </Box>
    </Box>
  );
}

function getEndScore(end: RoundEnd) {
  let endScore = 0;
  let isEndScoreValid = false;
  end.round_scores.forEach((roundScore) => {
    if (roundScore.score !== -1) isEndScoreValid = true;
    endScore += roundScore.score === 11 ? 10 : roundScore.score;
  });
  if (!isEndScoreValid) return -1;
  return endScore;
}
