
import { useState, FC, Dispatch, SetStateAction } from 'react'
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Grow from '@mui/material/Grow';
import Collapse from '@mui/material/Collapse';
import { useNavigate } from 'react-router-dom';

import { ClickAwayListener } from '@mui/material';

interface SidebarProps {
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
  sideBarOpen: boolean,
}

interface AssociativeArray {
	[key: string]: any;
}

interface sidebarItemProps {
	item: AssociativeArray,
	navigate: any
}

const SidebarItem: FC<sidebarItemProps> = ({item, navigate}) => {
	const [open, setOpen] = useState(false);

	const subitemMap = (v: any, i: number) => (
		<List key={i} component="div" disablePadding>
			<ListItemButton sx={{ pl: 4 }} onClick={() => navigate(v.route)}>
				<ListItemText primary={v.label} />
			</ListItemButton>
		</List>
	)

	return (
		<Box>
			<ListItem disablePadding>
				<ListItemButton
					onClick={() => {
						item.subitem? setOpen(!open):
						navigate(item.route)
					}}
				>
					<ListItemText primary={item.label} />
				</ListItemButton>
			</ListItem>
			{(item.subitem && <Collapse in={open} timeout="auto" unmountOnExit>
				{item.subitem.map(subitemMap)}
			</Collapse>)}
		</Box>
	)
}

const Sidebar: FC<SidebarProps> = ({ sideBarOpen, setSideBarOpen }) => {

  const navigate = useNavigate();
	const handleClose = () => {
		setSideBarOpen(false);
	}

	const menuItems = [
		{
			label: '首頁',
			route: '/',
		},
		{
			label: '比賽',
			route: '/Contests',
			subitem: [
				{
					label: '近期比賽',
					route: '/Contests',
				},
				{
					label: '我的比賽',
					route: '/Contests',
				},
			],
		},
		{
			label: '關於',
			route: '/Abouts',
		},
	]

  const list = () => (
		<Collapse in={sideBarOpen} timeout="auto" orientation="horizontal" unmountOnExit>
			<Box
				sx={{
					width: 200,
					// height: "calc(100vh - 64px)",
					height: "100vh",
					backgroundColor: "#87e8e3",
					top: { sm: "64px", xs: "56px" },
				}}
				role="presentation"

				position="relative"
				// onClick={toggleDrawer(anchor, false)}
				// onKeyDown={toggleDrawer(anchor, false)}
			>
				<Grow
					in={sideBarOpen}
					style={{ transformOrigin: '0 0 0' }}
					{...(sideBarOpen ? { timeout: 1000 } : {})}
				>
					<List>
						{menuItems.map((v, i) => (
							<SidebarItem key={i} item={v} navigate={navigate}/>
						))}
					</List>
				</Grow>
			</Box>
		</Collapse>
	);
	return (
		<ClickAwayListener onClickAway={handleClose}>
			<Box sx={{position:"fixed",	zIndex: 10}}>
				{/* {sideBarOpen && list()} */}
				{list()}
			</Box>
		</ClickAwayListener>
	)
}

export default Sidebar;