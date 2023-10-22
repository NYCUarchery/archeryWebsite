import { Box } from "@mui/material";
import PhaseSelector from "../PhaseSelector/PhaseSelector";

export default function ProgressBoard() {
  return (
    <div className="process_board">
      <Box sx={{ width: "200px", height: "100%" }}>
        <PhaseSelector></PhaseSelector>
      </Box>
    </div>
  );
}
