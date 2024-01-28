import { QueryClient, useMutation, useQueryClient } from "react-query";
import { Button } from "@mui/material";
import ButtonGroup from "@mui/material/ButtonGroup";
import { Backspace } from "@mui/icons-material";

import axios from "axios";
import { findUnfilledScoreInEnd } from "../util";
import { Player, Round, RoundEnd } from "../../../../QueryHooks/types/Player";

interface Props {
  selectedPlayer: Player;
  end: RoundEnd;
  round: Round;
  isConfirmed: boolean;
}
const putIsConfirmed = ({ roundEndID, isConfirmed }: any) => {
  return axios.put(`/api/player/isconfirmed/${roundEndID}`, {
    is_confirmed: !isConfirmed,
  });
};
const putScoreDeleted = ({ selectedPlayerID, round, end, lastScore }: any) => {
  return axios.put(`/api/player/roundscore/${lastScore.id}`, {
    player_id: selectedPlayerID,
    round_id: round.id,
    round_end_id: end.id,
    score: -1,
  });
};

export default function ControllButtonGroup({
  end,
  isConfirmed,
  round,
  selectedPlayer,
}: Props) {
  const queryClient = useQueryClient();
  const { mutate: toggleConfirmation } = useMutation(putIsConfirmed, {
    onSuccess: () => {
      queryClient.invalidateQueries([
        "laneWithPlayersScores",
        selectedPlayer.lane_id,
      ]);
    },
  });
  const { mutate: deleteScore } = useMutation(putScoreDeleted, {
    onSuccess: () => {
      invalidateLaneWithPlayerScoresQuery(queryClient, selectedPlayer);
    },
  });
  const lastScore = findUnfilledScoreInEnd(end);
  const handleConfirmation = (_event: any) => {
    if (end.is_confirmed)
      invalidateLaneWithPlayerScoresQuery(queryClient, selectedPlayer);
    else toggleConfirmation({ roundEndID: end.id, isConfirmed });
    console.log("handleConfirmation");
  };
  const handledelete = (_event: any) => {
    deleteScore({ selectedPlayerID: selectedPlayer.id, round, end, lastScore });
  };

  return (
    <ButtonGroup
      className="controll_button_group"
      fullWidth
      variant="text"
      disableElevation
    >
      <Button
        color={isConfirmed ? "success" : "error"}
        variant="contained"
        id={isConfirmed ? "confirmed" : "unconfirmed"}
        onClick={handleConfirmation}
        disableRipple={isConfirmed}
      >
        {isConfirmed ? "已確認" : "確認"}
      </Button>
      <Button
        startIcon={<Backspace />}
        disabled={
          end === undefined || end?.is_confirmed || lastScore === undefined
        }
        color="error"
        variant="contained"
        onClick={handledelete}
      ></Button>
    </ButtonGroup>
  );
}
function invalidateLaneWithPlayerScoresQuery(
  queryClient: QueryClient,
  selectedPlayer: Player
) {
  queryClient.invalidateQueries([
    "laneWithPlayersScores",
    selectedPlayer.lane_id,
  ]);
}
