import { ButtonGroup, Button } from "@mui/material";
import { useMutation, useQueryClient } from "react-query";

import axios from "axios";
import { findUnfilledScoreInEnd } from "../util";
import { Player, Round, RoundEnd } from "../../../../QueryHooks/types/Lane";

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
      queryClient.invalidateQueries([
        "laneWithPlayersScores",
        selectedPlayer.lane_id,
      ]);
    },
  });
  const lastScore = findUnfilledScoreInEnd(end);
  const handleConfirmation = (_event: any) => {
    toggleConfirmation({ roundEndID: end.id, isConfirmed });
  };
  const handledelete = (_event: any) => {
    deleteScore({ selectedPlayerID: selectedPlayer.id, round, end, lastScore });
  };

  return (
    <ButtonGroup
      className="controll_button_group"
      fullWidth
      variant="text"
      disabled={end?.is_confirmed}
      disableElevation
    >
      <Button
        className="confirm_button"
        id={isConfirmed ? "confirmed" : "unconfirmed"}
        onClick={handleConfirmation}
        disableRipple={isConfirmed}
      >
        {isConfirmed ? "已確認" : "確認"}
      </Button>
      <Button
        disabled={
          end === undefined || end?.is_confirmed || lastScore === undefined
        }
        className="cancel_button"
        onClick={handledelete}
      >
        &lt;=
      </Button>
    </ButtonGroup>
  );
}
