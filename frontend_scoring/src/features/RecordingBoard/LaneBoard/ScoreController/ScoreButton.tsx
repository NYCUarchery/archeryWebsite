import { Button } from "@mui/material";
import axios from "axios";
import { useMutation, useQueryClient } from "react-query";
import { findLastScoreInEnd } from "../util";

const buttonColors = new Map([
  [0, "black_score"],
  [1, "white_score"],
  [2, "white_score"],
  [3, "black_score"],
  [4, "black_score"],
  [5, "blue_score"],
  [6, "blue_score"],
  [7, "red_score"],
  [8, "red_score"],
  [9, "yellow_score"],
  [10, "yellow_score"],
  [11, "yellow_score"],
]);

interface Props {
  selectedPlayer: any;
  end: any;
  round: any;
  score: number;
}
const putScore = ({ selectedPlayerID, round, end, lastScore, value }: any) => {
  return axios.put(`/api/player/roundscore/${lastScore.id}`, {
    player_id: selectedPlayerID,
    round_id: round.id,
    round_end_id: end.id,
    score: value,
  });
};

export default function ScoreButton({
  selectedPlayer,
  end,
  round,
  score,
}: Props) {
  const queryClient = useQueryClient();
  const { mutate: updateScore } = useMutation(putScore, {
    onSuccess: () => {
      queryClient.invalidateQueries([
        "laneWithPlayersScores",
        selectedPlayer.lane_id,
      ]);
    },
  });
  let content: string = "";
  const buttonColor = buttonColors.get(score) as string;

  const lastScore = findLastScoreInEnd(end);
  const handleOnClick = () => {
    updateScore({
      selectedPlayerID: selectedPlayer.id,
      round: round,
      end: end,
      lastScore: lastScore,
      value: score,
    });
  };

  switch (score) {
    case 0:
      content = "M";
      break;
    case 11:
      content = "X";
      break;
    default:
      content = score.toString();
  }

  return (
    <Button
      disabled={
        end === undefined || end?.is_confirmed || lastScore === undefined
      }
      id={score.toString()}
      onClick={handleOnClick}
      variant="contained"
      color={buttonColor as unknown as undefined}
      sx={{
        boxShadow: "none",
        borderRadius: "0px",
        width: "20%",
      }}
    >
      {content}
    </Button>
  );
}
