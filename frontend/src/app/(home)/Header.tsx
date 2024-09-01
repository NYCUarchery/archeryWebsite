"use client";
import { useState, MouseEvent, Dispatch, SetStateAction, FC } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";

import Popper from "@mui/material/Popper";
import { ClickAwayListener } from "@mui/material";

import { Button } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grow from "@mui/material/Grow";

import Avatar from "@mui/material/Avatar";

import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";
import { useRouter } from "next/navigation";

interface HeaderProps {
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
}

const Header: FC<HeaderProps> = ({ setSideBarOpen }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: user, isError: isUserError } = useGetCurrentUserDetail();
  const router = useRouter();

  const handleMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (anchorEl === event.currentTarget) setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="relative">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
          onClick={(e) => {
            e.stopPropagation(); // the sidebar has a ClickAwayListener, we prevent the click-away event to propogate
            setSideBarOpen((prev) => !prev);
          }}
        >
          <MenuIcon />
        </IconButton>
        <Button
          variant="text"
          sx={{ color: "white" }}
          onClick={() => router.push("/")}
        >
          <Typography variant="h6" component="div">
            Archery
          </Typography>
        </Button>
        <ClickAwayListener onClickAway={handleClose}>
          <>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              sx={{ ml: "auto" }}
            >
              <Avatar alt="Remy Sharp" sx={{ width: 24, height: 24 }} />
            </IconButton>
            <Popper
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              placement="bottom-end"
            >
              <Grow
                in={Boolean(anchorEl)}
                style={{ transformOrigin: "0 0 0" }}
                {...(anchorEl ? { timeout: 400 } : {})}
              >
                <Card>
                  <CardContent
                    sx={{
                      display: "flex",
                      flexFlow: "column",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h6" component="div">
                      {user?.real_name ?? "訪客"}
                    </Typography>
                    <Box
                      component="div"
                      sx={{
                        display: "flex",
                        flexFlow: "column",
                        mt: "10px",
                      }}
                    >
                      <MenuList>
                        <MenuItem
                          aria-label="personal page"
                          onClick={() => {
                            handleClose();
                          }}
                        >
                          個人頁面
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            handleClose();
                            if (isUserError) {
                              router.push("/login");
                              return;
                            } else router.push("/logout");
                          }}
                        >
                          {isUserError ? "登入" : "登出"}
                        </MenuItem>
                      </MenuList>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Popper>
          </>
        </ClickAwayListener>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
