
import { useState, ChangeEvent, MouseEvent, Dispatch, SetStateAction, FC } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';


import Popper from '@mui/material/Popper';
import { ClickAwayListener, createTheme } from '@mui/material';

import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grow from '@mui/material/Grow';


import avatar from "../assets/images/avatar.jpg";
import { useNavigate } from 'react-router-dom';
// import { create } from 'domain';

import Avatar from '@mui/material/Avatar';

interface HeaderProps {
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
  setAuthorized: Dispatch<SetStateAction<boolean>>;
}

const Header: FC<HeaderProps> = ({ setSideBarOpen, setAuthorized }) => {
  const [auth, setAuth] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAuth(event.target.checked);
  };

  const handleMenu = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
		if (anchorEl == event.currentTarget) setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const navigate = useNavigate();

  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="fixed" sx={{zIndex: 99}}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={(e) => {
              setSideBarOpen(prev => !prev);
              e.stopPropagation(); // the sidebar has a ClickAwayListener, we prevent the click-away event to propogate
            }}
          >
            <MenuIcon />
          </IconButton>
          <Button variant="text" sx={{ color: "white"}} onClick={() => navigate("/")}>
            <Typography variant="h6" component="div">
              Archery
            </Typography>
          </Button>
          <div style={{flexGrow: 1}}></div>
          {auth && (
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
                    sx={{mr: "20px"}}
									>
										{/* <AccountCircle /> */}
                    <Avatar alt="Remy Sharp" src={avatar} sx={{ width: 24, height: 24 }}/>
									</IconButton>
									<Popper open={Boolean(anchorEl)} anchorEl={anchorEl} placement="bottom-end">
                    <Grow
                      in={Boolean(anchorEl)}
                      style={{ transformOrigin: '0 0 0' }}
                      {...(Boolean(anchorEl) ? { timeout: 400 } : {})}
                    >
                      <Card>
                        <CardContent sx={{display: "flex", flexFlow: "column", alignItems: "center"}}>
                          <img src={avatar} alt="My Avatar" width="100px" style={{cursor: "pointer"}} onClick={() => navigate("/PersonalPage")}/>
                          <Box component="div" sx={{display: "flex", flexFlow: "column", mt: "10px"}}>
                            <MenuList>

                              <MenuItem
                                aria-label="personal page"
                                onClick={() => {
                                  handleClose();
                                  navigate("/PersonalPage");
                                }}
                              >
                                個人頁面
                              </MenuItem>
                              <MenuItem
                                onClick={() => {
                                  handleClose();
                                  setAuthorized(false);
                                  fetch("http://localhost:8080/api/logout", {
                                    method: "GET",
                                  })
                                  .then((res) => {

                                    return res.json()
                                  })
                                  .then((resjson) => {
                                    console.log(resjson);
                                    if (resjson["result"] && resjson["result"] === "success") {
                                      console.log("Log Out Success");
                                      navigate("/login");
                                    } else {
                                      window.alert("");
                                    }
                                  });
                                }}
                              >
                                登出
                              </MenuItem>
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
}

export default Header;