
import { useState, FC, KeyboardEvent, MouseEvent} from 'react'
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
type Anchor = 'top' | 'left' | 'bottom' | 'right';

interface SidebarProps {
  sideBarOpen: boolean,
}

const Sidebar: FC<SidebarProps> = ({ sideBarOpen }) => {
	const [state, setState] = useState({
    top: false,
    left: false,
    bottom: false,
    right: false,
  });

  const toggleDrawer =
    (anchor: Anchor, open: boolean) =>
    (event: KeyboardEvent | MouseEvent) => {
      if (
        event.type === 'keydown' &&
        ((event as KeyboardEvent).key === 'Tab' ||
          (event as KeyboardEvent).key === 'Shift')
      ) {
        return;
      }

      setState({ ...state, [anchor]: open });
    };

  const list = () => (
    <Box
      sx={{
				width: 200,
				zIndex: 10,
				height: "calc(100vh - 64px)",
				backgroundColor: "#87e8e3",
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
					{['HomePage', 'Contests'].map((text, index) => (
						<ListItem key={text} disablePadding>
							<ListItemButton>
								<ListItemText primary={text} />
							</ListItemButton>
						</ListItem>
					))}
				</List>
			</Grow>
    </Box>
  );
	return (
		<>
			{sideBarOpen && list()}
			{/* {list()} */}
		</>
	)
}

export default Sidebar;