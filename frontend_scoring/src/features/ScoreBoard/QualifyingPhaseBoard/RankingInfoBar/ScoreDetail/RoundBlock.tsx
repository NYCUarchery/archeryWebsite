import { Box, Divider } from "@mui/material";
import { Round } from "../../../../../QueryHooks/types/Player";
import EndBar from "./EndBar";
import StatisticRow from "./StatisticRow";

interface Props {
  round: Round;
}
export default function RoundBlock({ round }: Props) {
  const ends = round.round_ends.map((end) => {
    return <EndBar end={end}></EndBar>;
  });
  if (round.total_score === 0) return <></>;
  const _10Num = get10num(round);
  const xNum = getXnum(round);

  return (
    <Box>
      <Box>{ends}</Box>
      <Divider />
      <StatisticRow
        _10Num={_10Num}
        xNum={xNum}
        totalScore={round.total_score}
      />
    </Box>
  );
}

const get10num = (round: Round) => {
  let num = 0;
  round.round_ends.forEach((end) => {
    end.round_scores.forEach((roundScore) => {
      if (roundScore.score === 10) num++;
    });
  });
  return num;
};
const getXnum = (round: Round) => {
  let num = 0;
  round.round_ends.forEach((end) => {
    end.round_scores.forEach((roundScore) => {
      if (roundScore.score === 11) num++;
    });
  });
  return num;
};
