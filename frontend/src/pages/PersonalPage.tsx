
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';

import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import { useNavigate } from 'react-router-dom';
import avatar from "../assets/images/avatar.jpg";

const PersonalPage = () => {
	const navigate = useNavigate();
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
									Godtone
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
									你以為你躲起來就找不到你了嗎，沒有用的。你是那樣拉風的男人，不管在什麼地方，就好像漆黑中的螢火蟲一樣，是那樣的鮮明，那樣的出眾。你那憂鬱的眼神，唏噓的鬍渣子，隨意叼著的牙籤，還有那杯 dry martine ，都深深的迷住了我。
									張嘉航,你真是電競界的罪人,你害怕你強大的天賦會蓋過其他人,選擇在接觸遊戲十年後再出道,而放棄與你的宿敵 FAKER 競爭神的寶座,今年該是你奪回神寶座的時候了。
								</Typography>
							</Grid>
							<Grid item xs={2} sx={{mt: 2}}>
								<Button variant="text" onClick={() => navigate("/ChangeInfo")} sx={{ color: "#2074d4" }}>
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