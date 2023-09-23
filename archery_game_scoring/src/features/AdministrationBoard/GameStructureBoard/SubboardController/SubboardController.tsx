import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { setSubboardShown } from "../gameStructureBoardSlice";

export default function SubboardController() {
  const dispatch = useDispatch();
  const subboardNames = useSelector(
    (state: any) => state.gameStructureBoard.subboardNames
  );
  const subboardShown = useSelector(
    (state: any) => state.gameStructureBoard.subboardShown
  );
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newSubboardShown: number | null
  ) => {
    dispatch(setSubboardShown(newSubboardShown));
  };

  let buttons = [];

  for (let i = 0; i < subboardNames.length; i++) {
    buttons.push(
      <ToggleButton className="subboard_controller_button" key={i} value={i}>
        {subboardNames[i]}
      </ToggleButton>
    );
  }

  return (
    <ToggleButtonGroup
      className="subboard_controller"
      exclusive
      value={subboardShown}
      onChange={handleChange}
      fullWidth
    >
      {buttons}
    </ToggleButtonGroup>
  );
}
