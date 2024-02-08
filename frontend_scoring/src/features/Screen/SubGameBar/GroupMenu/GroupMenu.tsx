import { Group } from "../../../../QueryHooks/types/Competition";

import { Menu, MenuItem, Button } from "@mui/material";

import { useSelector, useDispatch } from "react-redux";
import { selectGroup } from "./groupMenuSlice";

import { useEffect, useState } from "react";

interface Props {
  groups: Group[];
}

export default function GroupMenu({ groups }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dispatch = useDispatch();
  useEffect(() => {
    if (groups.length > 1) dispatch(selectGroup(groups[1].id));
    else dispatch(selectGroup(groups[0].id));
  }, []);
  const groupShown = useSelector((state: any) => state.groupMenu.groupShown);

  return (
    <>
      <Button
        color="primary"
        variant="contained"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        {groups.find((group) => group.id == groupShown)?.group_name}
      </Button>
      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        {groups.map((group, index) => {
          if (index === 0) return;
          return (
            <MenuItem
              key={index}
              onClick={() => {
                setAnchorEl(null);
                dispatch(selectGroup({ groupShown: group.id }));
              }}
            >
              {group.group_name}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
