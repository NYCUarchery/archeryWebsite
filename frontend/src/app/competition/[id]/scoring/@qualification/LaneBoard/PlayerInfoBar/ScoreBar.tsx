import Box from "@mui/material/Box";
import ScoreCircle from "@/components/ScoreCircle";

interface Props {
  scores: number[];
}

export default function ScoreBar(props: Props) {
  const scoreBlocks = [];
  for (let i = 0; i < props.scores.length; i++) {
    scoreBlocks.push(
      <ScoreCircle key={i} score={props.scores[i]}></ScoreCircle>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "center",
        height: "100%",
      }}
    >
      {scoreBlocks}
    </Box>
  );
}
