import { Box, Button } from "@mui/material";
import { EliminationMatchStatus } from "./useCurrentEliminationMatch";

// 對映 useCurrentEliminationMatch 各非 ready 狀態之明確中文提示（見契約 §3）。
type NonReadyStatus = Exclude<EliminationMatchStatus, { kind: "ready" }>;

interface Props {
  status: NonReadyStatus;
}

export default function EliminationScoringStates({ status }: Props) {
  const message = (() => {
    switch (status.kind) {
      case "loading":
        return "載入中，請稍候...";
      case "notLoggedIn":
        return "請先登入。";
      case "noParticipant":
        return "找不到您的參賽者資料。";
      case "noPlayer":
        return "找不到您的選手資料。";
      case "phaseInactive":
        return "目前對抗賽階段尚未開放記分。";
      case "noElimination":
        return "您的組別尚未建立對應的對抗賽。";
      case "noPlayerSet":
        return "您尚未被編入對抗賽的隊伍。";
      case "noMatch":
        return "目前尚未安排您的對局。";
      case "bye":
        return "本輪輪空，暫無需記分之對局。";
      case "stageOutOfRange":
        return "目前對抗賽階段資料異常（階段超出範圍）。";
      case "endOutOfRange":
        return "目前對抗賽局數資料異常（局數超出範圍）。";
      case "finished":
        return "對抗賽已結束。";
      case "error":
        return status.message;
    }
  })();

  return (
    <Box sx={{ textAlign: "center", mt: 4 }}>
      <p>{message}</p>
      {status.kind === "error" && (
        <Button variant="outlined" onClick={status.retry}>
          重試
        </Button>
      )}
    </Box>
  );
}
