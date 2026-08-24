import { Button } from "@mui/material";
import ButtonGroup from "@mui/material/ButtonGroup";
import { Backspace } from "@mui/icons-material";

// 泛型控制鈕群：刪除/送出/確認鈕之可用性由外部算好傳入
interface Props {
  isConfirmed: boolean;
  canDelete: boolean;
  isSaving: boolean;
  canConfirm?: boolean; // false 表示尚未選定記分對象，確認鈕停用並改為提示文字
  onDeleteScore: () => void;
  onSave: () => void;
  onConfirm?: () => void;
}

export default function ControllButtonGroup({
  isConfirmed,
  canDelete,
  isSaving,
  canConfirm = true,
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
          id={
            !canConfirm ? "no-selection" : isConfirmed ? "confirmed" : "unconfirmed"
          }
          disabled={!canConfirm}
          disableRipple={isConfirmed}
          sx={{
            height: "3rem",
            fontSize: "1rem",
            // 停用時交還 MUI 預設灰底，避免紅底誤導使用者以為可按。
            ...(canConfirm && {
              backgroundColor: isConfirmed ? "success.light" : "error.main",
            }),
          }}
          onClick={onConfirm}
        >
          {!canConfirm ? "請選取選手" : isConfirmed ? "已確認" : "確認"}
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
