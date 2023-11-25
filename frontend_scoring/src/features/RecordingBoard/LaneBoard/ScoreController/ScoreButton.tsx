import { Button } from "@mui/material";
import axios from "axios";
import { useMutation, useQueryClient } from "react-query";
import { findLastScoreInEnd } from "../util";

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
      className="score_button single_score"
      id={score.toString()}
      onClick={handleOnClick}
    >
      {content}
    </Button>
  );
}
