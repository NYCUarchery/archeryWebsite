import { Button } from "@mui/material";
import ButtonGroup from "@mui/material/ButtonGroup";
import { Backspace } from "@mui/icons-material";

import { DatabaseRoundEnd } from "@/types/Api";

interface Props {
  selectedEnd: DatabaseRoundEnd;
  isConfirmed: boolean;
  onDeleteScore: () => void;
  onSendScore: () => void;
  onConfirm: () => void;
}

export default function ControllButtonGroup({
  selectedEnd,
  isConfirmed,
  onDeleteScore,
  onSendScore,
  onConfirm,
}: Props) {
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
        disableRipple={isConfirmed}
        sx={{
          height: "3rem",
          fontSize: "1rem",
          backgroundColor: isConfirmed ? "success.light" : "error.main",
        }}
        onClick={onConfirm}
      >
        {isConfirmed ? "已確認" : "確認"}
      </Button>
      <Button variant="contained" onClick={onSendScore}>
        送出
      </Button>
      <Button
        startIcon={<Backspace />}
        disabled={selectedEnd === undefined || selectedEnd?.is_confirmed}
        color="error"
        variant="contained"
        sx={{ height: "3rem", fontSize: "1rem" }}
        onClick={onDeleteScore}
      ></Button>
    </ButtonGroup>
  );
}
// function invalidateLaneWithPlayerScoresQuery(
//   queryClient: QueryClient,
//   selectedPlayer: Player
// ) {
//   queryClient.invalidateQueries([
//     "laneWithPlayersScores",
//     selectedPlayer.lane_id,
//   ]);
// }
