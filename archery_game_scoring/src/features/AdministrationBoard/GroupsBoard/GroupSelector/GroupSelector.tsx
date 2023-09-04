import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useSelector } from "react-redux";
import { useState } from "react";

export default function GroupSelector() {
  const groupNames = useSelector((state: any) => state.groupsBoard.groupNames);
  const groupsNum = useSelector((state: any) => state.groupsBoard.groupsNum);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const handleSelection = (
    _event: React.MouseEvent<HTMLElement>,
    newGroupId: number | null
  ) => {
    setSelectedGroupId((_currentGroupId) => {
      return newGroupId;
    });
  };

  let buttons = [];
  for (let i = 0; i < groupsNum; i++) {
    buttons.push(
      <ToggleButton className="selector_button" key={i} value={i}>
        {groupNames[i]}
      </ToggleButton>
    );
  }
  console.log(selectedGroupId);

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
