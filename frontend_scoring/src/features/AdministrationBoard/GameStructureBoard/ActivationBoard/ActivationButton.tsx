import { Button } from "@mui/material";
import { activatePhase } from "../../../States/gameSlice";
import { useDispatch } from "react-redux";

interface Props {
  phaseId: number;
}

export default function ActivationButton({ phaseId }: Props) {
  const dispatch = useDispatch();
  let phaseName: string = "";

  switch (phaseId) {
    case 0:
      phaseName = "Qualification";
      break;
    case 1:
      phaseName = "Elimination";
      break;
    case 2:
      phaseName = "Team Elimination";
      break;
    case 3:
      phaseName = "Mixed Elimination";
      break;
  }

  return (
    <Button
      className="activation_button"
      onClick={() => dispatch(activatePhase(phaseName))}
      sx={{
        textTransform: "none",
      }}
    >
      {phaseName}
    </Button>
  );
}
