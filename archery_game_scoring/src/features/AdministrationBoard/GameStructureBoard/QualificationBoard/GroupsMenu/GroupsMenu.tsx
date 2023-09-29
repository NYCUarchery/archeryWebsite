import { Menu, MenuItem, Button } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { closeMenu, setGroupShown, toggleMenu } from "./groupsMenuSlice";
import { useState } from "react";

export default function GroupsMenu() {
  const isOpen = useSelector(
    (state: any) => state.qualificationStructureGroupMenu.isOpen
  );
  const groupShown = useSelector(
    (state: any) => state.qualificationStructureGroupMenu.groupShown
  );
  const groupNames = useSelector((state: any) => state.game.groupNames);
  const groupsNum = useSelector((state: any) => state.game.groupsNum);
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    dispatch(toggleMenu());
  };
  let items = [];

  for (let i = 1; i < groupsNum; i++) {
    items.push(
      <MenuItem onClick={() => dispatch(setGroupShown(i))} key={i}>
        {groupNames[i]}
      </MenuItem>
    );
  }

  return (
    <div>
      <Button onClick={handleClick}>{groupNames[groupShown]}</Button>
      <Menu
        open={isOpen}
        anchorEl={anchorEl}
        onClick={() => dispatch(closeMenu())}
      >
        {items}
      </Menu>
    </div>
  );
}
