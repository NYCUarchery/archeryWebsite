import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { selectGroupId } from "./groupSelectorSlice";

interface Props {
  groups: Group[];
}
interface Group {
  id: number;
  competition_id: number;
  group_name: string;
  group_range: string;
  bow_type: string;
  group_index: number;
  player_num: number;
}

export default function GroupSelector({ groups }: Props) {
  const dispatch = useDispatch();
  const groupNames = groups?.map((group) => group.group_name);
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
        {groupNames ? groupNames[i] : `不知道，所就叫第${i}組`}
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
