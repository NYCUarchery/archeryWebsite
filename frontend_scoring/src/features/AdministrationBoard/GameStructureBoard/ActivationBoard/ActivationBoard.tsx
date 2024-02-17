import { ButtonGroup } from "@mui/material";
import ActivationButton from "./ActivationButton";

export default function ActivationBoard() {
  let buttons = [];

  for (let i = 0; i < 4; i++) {
    buttons.push(<ActivationButton key={i} phaseIndex={i}></ActivationButton>);
  }

  return (
    <div className="activation_board">
      <ButtonGroup className="activation_button_group" orientation="vertical">
        {buttons}
      </ButtonGroup>
    </div>
  );
}
