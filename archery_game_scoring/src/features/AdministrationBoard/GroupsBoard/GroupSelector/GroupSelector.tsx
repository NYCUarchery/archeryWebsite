import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { selectGroupId } from "./groupSelectorSlice";

export default function GroupSelector() {
  const dispatch = useDispatch();
  const groupNames = useSelector((state: any) => state.groupsBoard.groupNames);
  const groupsNum = useSelector((state: any) => state.groupsBoard.groupsNum);
  const selectedGroupId = useSelector(
    (state: any) => state.groupSelector.selectedGroupId
  );

  const handleSelection = (
    _event: React.MouseEvent<HTMLElement>,
    newGroupId: number | null
  ) => {
    dispatch(selectGroupId(newGroupId));
  };

  let buttons = [];
  for (let i = 0; i < groupsNum; i++) {
    buttons.push(
      <ToggleButton className="group_selector_button" key={i} value={i}>
        {groupNames[i]}
      </ToggleButton>
    );
  }

  return (
    <ToggleButtonGroup
      className="group_selector"
      value={selectedGroupId}
      exclusive
      onChange={handleSelection}
      fullWidth
    >
      {buttons}
    </ToggleButtonGroup>
  );
}
