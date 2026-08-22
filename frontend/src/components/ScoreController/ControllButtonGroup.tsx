import { Button } from "@mui/material";
import ButtonGroup from "@mui/material/ButtonGroup";
import { Backspace } from "@mui/icons-material";

// 泛型控制鈕群：刪除/送出/確認鈕之可用性由外部算好傳入
interface Props {
  isConfirmed: boolean;
  canDelete: boolean;
  isSaving: boolean;
  onDeleteScore: () => void;
  onSave: () => void;
  onConfirm?: () => void;
}

export default function ControllButtonGroup({
  isConfirmed,
  canDelete,
  isSaving,
  onDeleteScore,
  onSave,
  onConfirm,
}: Props) {
  return (
    <ButtonGroup
      className="controll_button_group"
      fullWidth
      variant="text"
      disableElevation
    >
      {onConfirm !== undefined ? (
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
      ) : (
        <></>
      )}
      <Button variant="contained" disabled={isSaving} onClick={onSave}>
        送出
      </Button>
      <Button
        startIcon={<Backspace />}
        disabled={!canDelete}
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
