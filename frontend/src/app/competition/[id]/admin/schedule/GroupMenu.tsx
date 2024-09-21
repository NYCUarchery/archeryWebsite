import * as React from "react";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import { Box, Button } from "@mui/material";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { setGroupIndex } from "./scheduleSlice";

interface Props {
  groupNames: string[];
}

export default function GroupMenu({ groupNames }: Props) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const dispatch = useAppDispatch();
  const groupIndex = useAppSelector((state) => state.schedule.groupIndex);
  const open = Boolean(anchorEl);
  const handleClickButton = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (
    _event: React.MouseEvent<HTMLElement>,
    index: number
  ) => {
    dispatch(setGroupIndex(index));
    // queryClient.invalidateQueries(["qualificationPlayersDetail", index]);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Button onClick={handleClickButton}>{groupNames[groupIndex]}</Button>
      <Menu
        id="group-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "group-button",
          role: "group-menu",
        }}
      >
        {groupNames.map((name, index) => (
          <MenuItem
            key={name}
            disabled={index === 0}
            selected={index === groupIndex}
            onClick={(event) => handleMenuItemClick(event, index)}
          >
            {name}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
