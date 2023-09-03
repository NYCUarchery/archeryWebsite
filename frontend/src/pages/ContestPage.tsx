
import Grid from '@mui/material/Grid';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
// import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

import { useNavigate } from 'react-router-dom';
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


	const rows = [
		{
			"id": "1",
			"name": "2023亞錦代表隊選拔賽暨2024奧運代表隊選拔賽第一場",
			"holder": "我大交通射箭隊",
			"date": "2017-04-23 10:30",
			"dashboard": "https://google.com/",
			"participate": "未報名",
			"state": "可報名"
		},
		{
			"id": "2",
			"name": "The International, DOTA2 Championships 2023",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-24 10:30",
			"dashboard": "contest/2",
			"participate": "已報名",
			"state": "報名截止"
		},
		{
			"id": "3",
			"name": "BLAST Paris Major 2023",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-25 10:30",
			"participate": "未報名",
			"state": "進行中"
		},
		{
			"id": "4",
			"name": "stardew valley fair 2023",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-26 10:30",
			"participate": "未報名",
			"state": "已結束"
		},
		{
			"id": "5",
			"name": "Delicious Whirled Cup 2023",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-27 10:30",
			"participate": "未報名",
			"state": "延期"
		},
		{
			"id": "6",
			"name": "stardew valley fair 2023",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-28 10:30",
			"participate": "未報名",
			"state": "已取消"
		},
		{
			"id": "7",
			"name": "stardew valley fair 2023",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-29 10:30",
			"participate": "未報名",
			"state": "協辦單位拿錢跑了"
		},
		{
			"id": "8",
			"name": "stardew valley fair 2023",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-30 10:30",
			"participate": "未報名",
			"state": "氣態"
		},
	];



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


const ContestPage = () => {
	const navigate = useNavigate();
	return (
		
		<Card sx={{p: 2, mb: 2}}>
			<CardContent>
				<Box sx={{mb: 4}}>
					<Grid container justifyContent="center">
						<Grid item>
							<Typography variant="h5" component="div">
								比賽
							</Typography>
						</Grid>
					</Grid>
				</Box>
				{rows.map((v, i) => {
					return (
						<Box sx={{mb: 2}}>
						{/* <Paper> */}
							
							<Divider/>
							<Typography variant="body1" component="div" sx={{fontSize: 18}}>
								{v.name}
							</Typography>
							<Typography variant="body2" component="div">
								{v.holder} {v.date}
							</Typography>
							<Button
							 variant="text"
							 onClick={() => console.log("hello")}
							>
								<Typography variant="body2">
									查看記分板: {v.dashboard}
								</Typography>
							</Button>

							<Typography variant="body2" component="div">
								比賽狀況: {v.state}
							</Typography>
						{/* </Paper> */}
						</Box>
					)
				})}
				<Box sx={{mt: 2}}>
					<Grid container justifyContent="center">
						<Grid item>
							<Button variant="text" onClick={() => navigate("/CreateContest")} sx={{ color: "#2074d4" }}>
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