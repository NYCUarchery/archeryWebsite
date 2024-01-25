import { Menu, MenuItem, Button } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { closeMenu, setGroupShown, toggleMenu } from "./groupsMenuSlice";
import { useState } from "react";
import useGetGroupsWithPlayers from "../../../../QueryHooks/useGetGroupsWithPlayers";
import { useEffect } from "react";

export default function GroupsMenu() {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: groups } = useGetGroupsWithPlayers(competitionID);
  const dispatch = useDispatch();

  const isOpen = useSelector(
    (state: any) => state.gameStructureGroupMenu.isOpen
  );
  const groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    dispatch(toggleMenu());
  };
  useEffect(() => {
    if (groups === undefined) return;
    if (groups.length > 1) dispatch(setGroupShown(groups[1].id));
    else dispatch(setGroupShown(groups[0].id));
  }, []);

  if (!groups) {
    return <></>;
  }
  let items = [];

  for (let i = 1; i < groups.length; i++) {
    items.push(
      <MenuItem onClick={() => dispatch(setGroupShown(groups[i].id))} key={i}>
        {groups[i].group_name}
      </MenuItem>
    );
  }

  return (
    <div>
      <Button onClick={handleClick}>
        {groups.find((e: any) => e.id == groupShown)?.group_name}
      </Button>
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
