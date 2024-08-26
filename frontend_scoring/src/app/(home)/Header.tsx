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

interface HeaderProps {
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
}

const Header: FC<HeaderProps> = ({ setSideBarOpen }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (anchorEl === event.currentTarget) setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{ zIndex: 99 }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={(e) => {
              setSideBarOpen((prev) => !prev);
              e.stopPropagation(); // the sidebar has a ClickAwayListener, we prevent the click-away event to propogate
            }}
          >
            <MenuIcon />
          </IconButton>
          <Button variant="text" sx={{ color: "white" }}>
            <Typography variant="h6" component="div">
              Archery
            </Typography>
          </Button>
          {true && (
            <div>
              <ClickAwayListener onClickAway={handleClose}>
                <div>
                  <IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleMenu}
                    color="inherit"
                    sx={{ mr: "20px" }}
                  >
                    {/* <AccountCircle /> */}
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
                      {...(Boolean(anchorEl) ? { timeout: 400 } : {})}
                    >
                      <Card>
                        <CardContent
                          sx={{
                            display: "flex",
                            flexFlow: "column",
                            alignItems: "center",
                          }}
                        >
                          <img
                            alt="My Avatar"
                            width="100px"
                            style={{ cursor: "pointer" }}
                          />
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
                                }}
                              ></MenuItem>
                            </MenuList>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grow>
                  </Popper>
                </div>
              </ClickAwayListener>
            </div>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Header;
