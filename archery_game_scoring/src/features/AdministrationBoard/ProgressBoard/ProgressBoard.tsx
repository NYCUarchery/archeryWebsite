import { Box } from "@mui/material";
import PhaseSelector from "../PhaseSelector/PhaseSelector";
import EndSwitch from "./EndSwitch/EndSwitch";

export default function ProgressBoard() {
  return (
    <div className="process_board">
      <PhaseSelector></PhaseSelector>
      <Box sx={{ width: "300px", height: "100%" }}>
        <EndSwitch></EndSwitch>
      </Box>
    </div>
  );
}
