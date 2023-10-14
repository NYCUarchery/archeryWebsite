
import Grid from '@mui/material/Grid';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { useNavigate } from 'react-router-dom';
import avatar from "../assets/images/avatar.jpg";

import routing from '../util/routing';
import { useEffect, useState } from 'react';
import { userStore } from '../util/userReducer';
import { GetUserInfo } from '../util/api2';

interface UserInfo {
  overview: string;
	organization: string;
	name: string;
}

const PersonalPage = () => {
	const navigate = useNavigate();
	const [ userinfo, setUserinfo ] = useState<UserInfo | undefined>(undefined);
	useEffect(() => {
		const uid = userStore.getState().uid;
		const fetchData = async () => {
      try {
        const info = await GetUserInfo(uid);
        console.log("info: ", info);
        setUserinfo(info.data);
      } catch (error) { }
    };

    fetchData();
	}, [])
	
	return (
		<Card sx={{p: 2, mb: 2}}>
			<CardContent>
				<Grid container flexDirection="row-reverse" alignItems="stretch" justifyContent="center" spacing={2}>

					<Grid item xs={4} sx={{minWidth: "160px"}}>
						<img src={avatar} alt="My Avatar" width="160px" />
					</Grid>
					<Grid item xs={8}>
						<Grid container direction="column" alignItems="stretch" justifyContent="center">
							<Grid item xs={2}>
								<Typography variant="h6" component="div">
									{userinfo?.name}
								</Typography>
							</Grid>
							<Grid item xs={2}>
								<Typography variant="h6" component="div">
									{userinfo?.organization}
								</Typography>
							</Grid>
							<Grid item xs={2} sx={{mt: 2}}>
								<Typography variant="body2" component="div" sx={styles.overview}>
									{userinfo?.overview}
								</Typography>
							</Grid>
							<Grid item xs={2} sx={{mt: 2}}>
								<Button variant="text" onClick={() => navigate(routing.ChangeInfo)} sx={styles.button}>
									<Typography variant="body1" component="div">
										修改個人資料
									</Typography>
								</Button>
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</CardContent>
		</Card>
	)
}

const styles = {
  overview: {
    maxHeight: "200px",
    overflowY: "scroll",
    p: "5px",
    '&::-webkit-scrollbar': {
      width: '1px',
    },
    '&::-webkit-scrollbar-track': {
      boxShadow: 'inset 0 0 1px #000',
      webkitBoxShadow: 'inset 0 0 1px #000',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: '#2074d410',
      outline: '1px solid #2074d4',
    },
    userSelect: 'none',
  },
  button: {
    color: "#2074d4",
  },
};

export default PersonalPage;