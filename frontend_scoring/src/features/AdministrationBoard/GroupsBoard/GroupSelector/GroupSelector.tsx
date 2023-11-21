import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { selectGroup } from "./groupSelectorSlice";

interface Props {
  groups: any[];
}

export default function GroupSelector({ groups }: Props) {
  const dispatch = useDispatch();
  const selectedGroupID = useSelector(
    (state: any) => state.groupSelector.selectedGroupID
  );

  const handleSelection = (
    _event: React.MouseEvent<HTMLElement>,
    newGroupID: number | null
  ) => {
    dispatch(selectGroup({ groupID: newGroupID }));
  };

  let buttons = [];
  for (let i = 0; i < groups.length; i++) {
    buttons.push(
      <ToggleButton
        className="group_selector_button"
        key={i}
        value={groups[i].id}
      >
        {groups[i].group_name == "unassigned" ? "無組別" : groups[i].group_name}
      </ToggleButton>
    );
  }

  return (
    <ToggleButtonGroup
      className="group_selector"
      value={selectedGroupID}
      exclusive
      onChange={handleSelection}
      fullWidth
    >
      {buttons}
    </ToggleButtonGroup>
  );
}
