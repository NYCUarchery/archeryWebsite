import { Box, Divider } from "@mui/material";
import EndBar from "./EndBar";
import StatisticRow from "./StatisticRow";
import { RoundStats } from "@/utils/calculatePlayerStatistics";

interface Props {
  round: RoundStats;
}
export default function RoundBlock({ round }: Props) {
  const ends = round.ends.map((end, index) => {
    return <EndBar end={end} key={index}></EndBar>;
  });

  return (
    <Box>
      <Box>{ends}</Box>
      <Divider />
      <StatisticRow
        totalTens={round.totalTens}
        totalScore={round.totalScore}
        totalXs={round.totalXs}
      />
    </Box>
  );
}
