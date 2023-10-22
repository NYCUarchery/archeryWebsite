import { Box } from "@mui/material";
import PhaseSelector from "../PhaseSelector/PhaseSelector";
import EndSwitch from "./EndSwitch/EndSwitch";
import OverviewBlock from "./OverviewBlock/OverviewBlock";
import PlayerStatusBlock from "./PlayerStatusBlock/PlayerStatusBlock";

export default function ProgressBoard() {
  return (
    <>
      <PhaseSelector></PhaseSelector>
      <Box
        className="process_board"
        sx={{
          display: "flex",
        }}
      >
        <Box sx={{ width: "300px", height: "100%" }}>
          <EndSwitch></EndSwitch>
          <OverviewBlock></OverviewBlock>
        </Box>
        <PlayerStatusBlock></PlayerStatusBlock>
      </Box>
    </>
  );
}
