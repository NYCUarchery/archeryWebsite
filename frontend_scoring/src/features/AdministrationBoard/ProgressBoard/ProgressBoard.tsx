import { Box } from "@mui/material";
import PhaseSelector from "../PhaseSelector/PhaseSelector";
import { useSelector } from "react-redux";
import Qualification from "./Qualification/Qualification";

export default function ProgressBoard() {
  const phaseShown = useSelector(
    (state: any) => state.adminPhaseSelector.phaseShown
  );

  let board = <Qualification></Qualification>;
  switch (phaseShown) {
    case 0:
      board = <Qualification></Qualification>;
  }

  return (
    <>
      <PhaseSelector></PhaseSelector>
      <Box
        className="process_board"
        sx={{
          display: "flex",
        }}
      >
        {board}
      </Box>
    </>
  );
}
