
import { useState, FC, KeyboardEvent, MouseEvent, Dispatch, SetStateAction } from 'react'
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Grow from '@mui/material/Grow';
import Collapse from '@mui/material/Collapse';
import { useNavigate } from 'react-router-dom';

import { ClickAwayListener } from '@mui/material';

interface SidebarProps {
  setSideBarOpen: Dispatch<SetStateAction<boolean>>;
  sideBarOpen: boolean,
}

const Sidebar: FC<SidebarProps> = ({ sideBarOpen, setSideBarOpen }) => {

  const navigate = useNavigate();
	const handleClose = () => {
		setSideBarOpen(false);
	}

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
						{[{
								label: '首頁',
								route: '/'
							}, {
								label: '比賽',
								route: '/Contests'
							}, {
								label: '關於',
								route: '/Abouts'

							}].map((v, i) => (
							<ListItem key={v.label} disablePadding>
								<ListItemButton
									onClick={() => {
										navigate(v.route)
									}}

								>
									<ListItemText primary={v.label} />
								</ListItemButton>
							</ListItem>
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