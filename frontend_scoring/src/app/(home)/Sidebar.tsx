"use client";
import { useState, FC, Dispatch, SetStateAction } from "react";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Grow from "@mui/material/Grow";
import Collapse from "@mui/material/Collapse";

import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

import { redirect } from "next/navigation";

import { ClickAwayListener } from "@mui/material";

interface SidebarProps {
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
  sideBarOpen: boolean;
}

interface AssociativeArray {
  [key: string]: any;
}

interface sidebarItemProps {
  item: AssociativeArray;
}

const SidebarItem: FC<sidebarItemProps> = ({ item }) => {
  const [open, setOpen] = useState(false);

  const subitemMap = (v: any, i: number) => (
    <List key={i} component="div" disablePadding>
      <ListItemButton sx={{ pl: 4 }} onClick={() => redirect(v.route)}>
        <ListItemText primary={v.label} />
      </ListItemButton>
    </List>
  );

  return (
    <Box>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => {
            item.subitem ? setOpen(!open) : redirect(item.route);
          }}
        >
          <ListItemText primary={item.label} />
          {item.subitem && (open ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
      </ListItem>
      {item.subitem && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          {item.subitem.map(subitemMap)}
        </Collapse>
      )}
    </Box>
  );
};

const Sidebar: FC<SidebarProps> = ({ sideBarOpen, setSideBarOpen }) => {
  const handleClose = () => {
    setSideBarOpen(false);
  };

  const menuItems = [
    {
      label: "首頁",
      route: "/",
    },
    {
      label: "比賽",
      route: "/recent_competitions",
      subitem: [
        {
          label: "近期比賽",
          route: "/recent_competitions",
        },
        {
          label: "我的比賽",
          route: "my_competitions",
        },
      ],
    },
    {
      label: "關於",
      route: "/about",
    },
  ];

  const list = () => (
    <Collapse
      in={sideBarOpen}
      timeout="auto"
      orientation="horizontal"
      unmountOnExit
    >
      <Box
        sx={{
          width: 200,
          height: "100vh",
          backgroundColor: "#87e8e3",
          top: { sm: "64px", xs: "56px" },
        }}
        role="presentation"
      >
        <Grow
          in={sideBarOpen}
          style={{ transformOrigin: "0 0 0" }}
          {...(sideBarOpen ? { timeout: 1000 } : {})}
        >
          <List>
            {menuItems.map((v, i) => (
              <SidebarItem key={i} item={v} />
            ))}
          </List>
        </Grow>
      </Box>
    </Collapse>
  );
  return <Box sx={{ position: "fixed", zIndex: 10 }}>{list()}</Box>;
};

export default Sidebar;
