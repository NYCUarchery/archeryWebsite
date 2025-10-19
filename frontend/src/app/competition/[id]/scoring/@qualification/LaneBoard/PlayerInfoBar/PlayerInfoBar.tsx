import NameBar from "./NameBar";
import ScoreBar from "./ScoreBar";
import { extractScores } from "../../../../../../../components/ScoreController/util";
import { Player } from "@/types/oldRef/Player";
import { DatabaseRoundEnd } from "@/types/Api";
import { Typography, Box } from "@mui/material";
import CircleSign from "@/components/CircleSign";

interface Props {
  player: Player;
  end: DatabaseRoundEnd;
}

export default function PlayerInfo({ player, end }: Props) {
  if (!player) return <></>;
  const scores = extractScores(end);
  const isConfirmed = end?.is_confirmed ?? false;
  const totalScore: number = scores.reduce((acc, curr) => {
    let sum = acc + curr;
    if (curr === 11) {
      sum -= 1;
    } else if (curr === -1) {
      sum += 1;
    }
    return sum;
  }, 0);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%",
      }}
    >
      <CircleSign
        backgroundColor={isConfirmed ? "green" : "red"}
        diameter={20}
        text={isConfirmed ? "✔" : "-"}
      ></CircleSign>
      <NameBar name={player.name}></NameBar>
      <Typography variant="h6">{totalScore}</Typography>
      <ScoreBar scores={scores}></ScoreBar>
    </Box>
  );
}
