import Box from "@mui/material/Box";
import ScoreBlock from "@/components/ScoreBlock";

interface Props {
  scores: number[];
}

export default function ScoreBar(props: Props) {
  const scoreBlocks = [];
  for (let i = 0; i < props.scores.length; i++) {
    scoreBlocks.push(
      <ScoreBlock key={i} score={props.scores[i]}></ScoreBlock>
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
