
import Grid from '@mui/material/Grid';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { useNavigate } from 'react-router-dom';
import avatar from "../assets/images/avatar.jpg";

import routing from '../util/routing';
import UserContext from '../util/userContext';
import { useContext, useEffect, useState } from 'react';
import api from '../util/api';

interface UserInfo {
  overview: string;
	organization: string;
	name: string;
}

const PersonalPage = () => {
	const navigate = useNavigate();
	const { uid } = useContext(UserContext);
	const [ userinfo, setUserinfo ] = useState<UserInfo | undefined>(undefined);
	useEffect(() => {
		fetch(`${api.user.info}/${uid}`, {
			method: "GET",
			credentials: "include",
		})
		.then((res) => {
			switch(res.status) {
				case 200:
					break;
				case 400:
					window.alert("不正確的 uid");
					break;
				case 404:
					window.alert("查無此人ㄛ");
					break;
			}
			return res.json();
		})
		.then((resjson) => {
			setUserinfo(resjson);
		})
		.catch((err) => console.log(err));
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
								<Typography variant="body2" component="div" sx={{ maxHeight: "200px", overflowY: "scroll", p: "5px",
									'&::-webkit-scrollbar': {
										width: '1px'
									}, 
									'&::-webkit-scrollbar-track': {
										boxShadow: 'inset 0 0 1px #000',
										webkitBoxShadow: 'inset 0 0 1px #000'
									},
									'&::-webkit-scrollbar-thumb': {
										backgroundColor: '#2074d410',
										outline: '1px solid #2074d4'
									},
									'userSelect': 'none',
								}}>
									{userinfo?.overview}
								</Typography>
							</Grid>
							<Grid item xs={2} sx={{mt: 2}}>
								<Button variant="text" onClick={() => navigate(routing.ChangeInfo)} sx={{ color: "#2074d4" }}>
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

export default PersonalPage;