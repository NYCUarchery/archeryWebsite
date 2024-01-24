import { Card, Divider } from "@mui/material";
import { Player } from "../../../../../QueryHooks/types/Player";
import RoundBlock from "./RoundBlock";
import useGetPlayerWithScores from "../../../../../QueryHooks/useGetPlayerWithScores";
import StatisticRow from "./StatisticRow";

interface Props {
  playerShell: Player;
}

export default function ScoreDetail({ playerShell }: Props) {
  const { data: player } = useGetPlayerWithScores(playerShell.id);
  if (!player) return <></>;
  const rounds = player.rounds?.map((round) => {
    return <RoundBlock round={round}></RoundBlock>;
  });
  const { _10Num, xNum } = get10AndXNum(player);

  return (
    <Card sx={{ width: "350px" }}>
      {rounds}
      <Divider textAlign="left">總計</Divider>
      <StatisticRow
        _10Num={_10Num}
        xNum={xNum}
        totalScore={player.total_score}
      />
    </Card>
  );
}

function get10AndXNum(player: Player) {
  let _10Num = 0;
  let xNum = 0;

  player.rounds?.forEach((round) => {
    round.round_ends.forEach((end) => {
      end.round_scores.forEach((roundScore) => {
        if (roundScore.score === 10) _10Num++;
        if (roundScore.score === 11) xNum++;
      });
    });
  });

  return { _10Num, xNum };
}
