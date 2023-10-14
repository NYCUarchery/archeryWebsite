import { useState } from 'react';

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
import { joinCompetition } from '../util/api';


const ContestPage = () => {
	const navigate = useNavigate();
	var [rows, setRows] = useState<any[]>([]);
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
							<Typography variant="body1" component="div" sx={{fontSize: 18}}>
								{v.name}
							</Typography>
							<Typography variant="body2" component="div">
								{v.holder} {v.date}
							</Typography>
							<Button
								variant="text"
								onClick={() => {
									if (v.dashboard) 
										if(v.dashboard.slice(0, 4) == "http") {
											window.location.href = v.dashboard;
										} else {
											navigate(v.dashboard);
										}
								}}
							>
								<Typography variant="body2">
									查看記分板: {v.dashboard}
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
													const result = await joinCompetition();
											
													if (result && result.error) {
														console.log(result.error);
													} else { }
												} catch (error) {
													console.log(error);
												}
											};
											handleJoinCompetition()
										}}
										disabled={!v.canParticipate}
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

// import Button from '@mui/material/Button';

// const ContestPage = () => {

// 	const columns: GridColDef[] = [
// 		{ field: 'id', headerName: "ID", type: 'number',},
// 		// { field: 'name', headerName: "名稱", type: 'string', width: 300,},
// 		{ field: 'name', headerName: "名稱", type: 'string'},
// 		// { field: 'holder', headerName: "主辦單位", width: 100,},
// 		{ field: 'holder', headerName: "主辦單位",},
// 		// { field: 'date', headerName: "比賽日期", width: 100,
// 		{ field: 'date', headerName: "比賽日期",
// 			valueFormatter: params => new Date(params?.value).toLocaleString(), },
// 		{
// 			field: "dashboard",
// 			headerName: "記分板",
// 			// width: 150,
// 			renderCell: (params) => {
// 				if (params) return (
// 					<Button onClick={() => {
// 						if (params.value.slice(0, 4) == "http") {
// 							window.location.href = params.value;
// 						} else {
// 							navigate(params.value);
// 						}
// 					}}>{params.value}</Button>
// 				)
// 				return (<></>)
// 			},
// 			sortable: false,
// 		},
// 		// { field: 'participate', headerName: "參加狀況", width: 70,},
// 		{ field: 'participate', headerName: "參加狀況",},
// 	]

//   const navigate = useNavigate();

// 	return (
// 		<>
// 			<Card sx={{p: 2, mb: 2}}>
// 				<CardContent>
// 					<Box sx={{mt: 2}}>
// 						<Grid container justifyContent="center">
// 							<Grid item>
// 								<Typography variant="h6" component="div">
// 									比賽
// 								</Typography>
// 							</Grid>
// 						</Grid>
// 					</Box>

// 					<Box sx={{mt: 2, display: 'grid', gridTemplateColumns: '1fr'}}> {/* https://github.com/mui/mui-x/issues/8175 */}
// 						<DataGrid
// 							rows={rows}
// 							columns={columns}
// 							initialState={{
// 								pagination: {
// 									paginationModel: { page: 0, pageSize: 5 },
// 								},

// 							}}
// 							columnVisibilityModel={{
// 								id: false,
// 								// dashboard: false,
// 							}}
// 							pageSizeOptions={[5]} // select the items show per page
// 							// checkboxSelection // add a checkbox
// 							disableColumnMenu={true} // disable the column menu, including hiding columns, sorting plans
// 							disableRowSelectionOnClick 
// 						/>
// 					</Box>

// 					<Box sx={{mt: 2}}>
// 						<Grid container justifyContent="center">
// 							<Grid item>
// 								<Button variant="text" onClick={() => navigate("/CreateContest")} sx={{ color: "#2074d4" }}>
// 									<Typography variant="h6" component="div">
// 										創建新的比賽
// 									</Typography>
// 								</Button>
// 							</Grid>
// 						</Grid>
// 					</Box>
// 				</CardContent>
// 			</Card>

// 			<Card sx={{p: 2, mb: 2}}>
// 				<CardContent>
// 					<Box sx={{mt: 2}}>
// 						<Grid container justifyContent="center">
// 							<Grid item>
// 								<Typography variant="h6" component="div">
// 									我報名的比賽
// 								</Typography>
// 							</Grid>
// 						</Grid>
// 					</Box>

// 					<Box sx={{mt: 2}}>
// 						<DataGrid
// 							// rows={rows}
// 							rows={[]}
// 							columns={columns.slice(0, 4)}
// 							initialState={{
// 								pagination: {
// 									paginationModel: { page: 0, pageSize: 5 },
// 								},

// 							}}
// 							columnVisibilityModel={{
// 								id: false,
// 								// dashboard: false,
// 							}}
// 							pageSizeOptions={[5]} // select the items show per page
// 							// checkboxSelection // add a checkbox
// 							disableColumnMenu={true} // disable the column menu, including hiding columns, sorting plans
// 							disableRowSelectionOnClick 
// 						/>
// 					</Box>

// 					{/* <Box sx={{mt: 2}}>
// 						<Grid container justifyContent="center">
// 							<Grid item>
// 								<Button variant="text" onClick={() => navigate("/CreateContest")} sx={{ color: "#2074d4" }}>
// 									<Typography variant="h6" component="div">
// 										創建新的比賽
// 									</Typography>
// 								</Button>
// 							</Grid>
// 						</Grid>
// 					</Box> */}
// 				</CardContent>
// 			</Card>
// 		</>
// 	)
// }

// export default ContestPage;
