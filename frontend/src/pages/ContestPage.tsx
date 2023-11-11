import { useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import { useNavigate } from 'react-router-dom';

import routing from '../util/routing';
import { joinCompetition, getCompetitions } from '../util/api';
import getDate from 'date-fns/getDate';
import getMonth from 'date-fns/getMonth';
import getYear from 'date-fns/getYear';
import getISODay from 'date-fns/getISODay';

const Day2Mandarin = (day: number) => {
	return ['一', '二', '三', '四', '五', '六', '日'][day-1];
}

const TimeView = (date: string) => {
	const fdate = new Date(date);
	const dateString = `${getYear(fdate)}年${getMonth(fdate)}月${getDate(fdate)}日 （${Day2Mandarin(getISODay(fdate))}）`
	return (
		<p>
			{dateString}
		</p>
	)
}

const ContestPage = () => {
	const navigate = useNavigate();
	var [rows, setRows] = useState<any[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await getCompetitions();
				// console.log(response.data.data)
				setRows(response.data.data);
			} catch (error) {}
		};
		fetchData();
	}, [])

	return (
		
		<Card sx={{p: 2, mb: 2}}>
			<CardContent>
				<Box sx={{mb: 4}}>
					<Grid container justifyContent="center">
						<Grid item>
							<Typography variant="h5" component="div">
								近期比賽
							</Typography>
						</Grid>
					</Grid>
				</Box>
				{rows.map((v, i) => {
					return (
						<Box key={i} sx={{mb: 2}}>
							<Divider/>
							<Typography variant="body2" component="div" sx={{fontSize: 30}}>
								{v.name}
							</Typography>
							<Typography variant="body2" component="div">
								{TimeView(v.date)}
							</Typography>
							<Typography variant="body2" component="div">
								{v.overview}
							</Typography>
							<Button
								variant="text"
								onClick={() => {
									if (v.scoreboardURL) 
										if(v.scoreboardURL.slice(0, 4) == "http") {
											window.location.href = v.scoreboardURL;
										} else {
											navigate(v.scoreboardURL);
										}
								}}
							>
								<Typography variant="body2">
									查看記分板: {v.scoreboardURL}
								</Typography>
							</Button>

							<Typography variant="body2" component="div">
								比賽狀況: {v.state}
							</Typography>

							<Grid container justifyContent="center">
								<Grid item sx={{width: "70%"}}>
									<Button 
										variant="text"
										sx={{ color: "#2074d4", width: "100%" }}
										onClick={() => {
											const handleJoinCompetition = async () => {
												try {
													const result = await joinCompetition(v.id);
													if (result.result == "success") {
														window.alert("報名成功");
													} else {
														window.alert("報名失敗");
													}
												} catch (error) { }
											};
											handleJoinCompetition()
										}}
									>
										<Typography variant="body1" component="div">
											立即報名
										</Typography>
									</Button>
								</Grid>
							</Grid>
						</Box>
					)
				})}
				<Box sx={{mt: 2}}>
					<Grid container justifyContent="center">
						<Grid item>
							<Button variant="text" onClick={() => navigate(routing.CreateContest)} sx={{ color: "#2074d4" }}>
								<Typography variant="h6" component="div">
									創建新的比賽
								</Typography>
							</Button>
						</Grid>
					</Grid>
				</Box>
			</CardContent>
		</Card>
	)
}

export default ContestPage;
