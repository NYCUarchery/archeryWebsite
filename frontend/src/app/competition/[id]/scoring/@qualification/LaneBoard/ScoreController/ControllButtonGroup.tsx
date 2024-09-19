import { QueryClient, useQueryClient } from "react-query";
import { Button } from "@mui/material";
import ButtonGroup from "@mui/material/ButtonGroup";
import { Backspace } from "@mui/icons-material";

import { Player, Round, RoundEnd } from "@/types/oldRef/Player";

interface Props {
  selectedEnd: RoundEnd;
  isConfirmed: boolean;
}

export default function ControllButtonGroup({
  selectedEnd,
  isConfirmed,
}: Props) {
  const handleConfirmation = (_event: any) => {};
  const handledelete = (_event: any) => {};

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
        sx={{
          height: "3rem",
          fontSize: "1rem",
          backgroundColor: isConfirmed ? "success.light" : "error.main",
        }}
      >
        {isConfirmed ? "已確認" : "確認"}
      </Button>
      <Button
        startIcon={<Backspace />}
        disabled={selectedEnd === undefined || selectedEnd?.is_confirmed}
        color="error"
        variant="contained"
        onClick={handledelete}
        sx={{ height: "3rem", fontSize: "1rem" }}
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
