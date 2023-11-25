import { Box } from "@mui/material";
import ResultBlock from "./ResultBlock/ResultBlock";

interface Props {
  match: any;
}

export default function MatchBlock({ match }: Props) {
  return (
    <Box>
      <ResultBlock result={match.match_results[0]}></ResultBlock>
      <ResultBlock result={match.match_results[1]}></ResultBlock>
    </Box>
  );
}
