import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { setPhaseShown } from "./phaseSelectorSlice";

const phaseNames = ["資格賽", "對抗賽", "團體對抗賽", "混雙對抗賽"];

export default function PhaseSelector() {
  const phaseShown = useSelector(
    (state: any) => state.adminPhaseSelector.phaseShown
  );
  const dispatch = useDispatch();

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newPhaseShown: number
  ) => {
    dispatch(setPhaseShown(newPhaseShown));
  };

  let buttons = [];
  for (let i = 0; i < 4; i++) {
    buttons.push(
      <ToggleButton className="phase_selector_button" key={i} value={i}>
        {phaseNames[i]}
      </ToggleButton>
    );
  }

  return (
    <ToggleButtonGroup
      value={phaseShown}
      exclusive
      onChange={handleChange}
      fullWidth
    >
      {buttons}
    </ToggleButtonGroup>
  );
}
