import { Card, Divider } from "@mui/material";
import RoundBlock from "./RoundBlock";
import StatisticRow from "./StatisticRow";
import { PlayerStats } from "../../../../../util/calculatePlayerStatistics";

interface Props {
  playerStats: PlayerStats;
}

export default function ScoreDetail({ playerStats }: Props) {
  const rounds = playerStats.rounds?.map((round) => {
    return <RoundBlock round={round}></RoundBlock>;
  });

  return (
    <Card
      sx={{
        width: "100%",
        height: "22rem",
        overflowY: "auto",
      }}
    >
      {rounds}
      <Divider textAlign="left">總計</Divider>
      <StatisticRow
        totalTens={playerStats.totalTens}
        totalXs={playerStats.totalXs}
        totalScore={playerStats.totalScore}
      />
    </Card>
  );
}
