import { Card, Divider } from "@mui/material";
import { Player } from "../../../../../QueryHooks/types/Player";
import RoundBlock from "./RoundBlock";
import useGetPlayerWithScores from "../../../../../QueryHooks/useGetPlayerWithScores";
import StatisticRow from "./StatisticRow";
import {
  PlayerStats,
  calculatePlayerStats,
} from "../../../../../util/makePlayerStatistics";

interface Props {
  playerShell: Player;
}

export default function ScoreDetail({ playerShell }: Props) {
  const { data: player } = useGetPlayerWithScores(playerShell.id);
  if (!player) return <></>;
  const playerStats = calculatePlayerStats(player) as PlayerStats;
  console.log(playerStats, player);
  const rounds = playerStats.rounds?.map((round) => {
    return <RoundBlock round={round}></RoundBlock>;
  });

  return (
    <Card sx={{ width: "350px" }}>
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
