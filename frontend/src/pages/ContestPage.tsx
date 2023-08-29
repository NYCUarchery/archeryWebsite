
import Grid from '@mui/material/Grid';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Typography from '@mui/material/Typography';

import Box from '@mui/material/Box';

import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';

const ContestPage = () => {

	const columns: GridColDef[] = [
		{ field: 'id', headerName: "ID", width: 70, type: 'number', },
		{ field: 'holder', headerName: "主辦單位", width: 150 },
		{ field: 'date', headerName: "比賽日期", width: 200,
			valueFormatter: params => new Date(params?.value).toLocaleString() },
		{
			field: "dashboard",
			headerName: "記分板",
			width: 300,
			renderCell: (params) => {
				if (params) return (
					<Button onClick={() => {
						if (params.value.slice(0, 4) == "http") {
							window.location.href = params.value;
						} else {
							navigate(params.value);
						}
					}}>{params.value}</Button>
				)
				return (<></>)
			},
			sortable: false,
		},
		{ field: 'participate', headerName: "參加狀況", width: 150},
	]


	const rows = [
		{
			"id": "1",
			"holder": "我大交通射箭隊",
			"date": "2017-04-23 10:30",
			"dashboard": "https://google.com/",
			"participate": "未報名",
		},
		{
			"id": "2",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-24 10:30",
			"dashboard": "contest/2",
			"participate": "已報名",
		},
		{
			"id": "3",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-25 10:30",
			"participate": "未報名",
		},
		{
			"id": "4",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-26 10:30",
			"participate": "未報名",
		},
		{
			"id": "5",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-27 10:30",
			"participate": "未報名",
		},
		{
			"id": "6",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-28 10:30",
			"participate": "未報名",
		},
		{
			"id": "7",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-29 10:30",
			"participate": "未報名",
		},
		{
			"id": "8",
			"holder": "隔壁校射箭隊",
			"date": "2017-04-30 10:30",
			"participate": "未報名",
		},
	];



  const navigate = useNavigate();

	return (
		<>
			<Card sx={{p: 2, mb: 2}}>
				<CardContent>
					<Box sx={{mt: 2}}>
						<Grid container justifyContent="center">
							<Grid item>
								<Typography variant="h6" component="div">
									比賽
								</Typography>
							</Grid>
						</Grid>
					</Box>

					<Box sx={{mt: 2}}>
						<DataGrid
							rows={rows}
							columns={columns}
							initialState={{
								pagination: {
									paginationModel: { page: 0, pageSize: 5 },
								},

							}}
							columnVisibilityModel={{
								id: false,
								// dashboard: false,
							}}
							pageSizeOptions={[5]} // select the items show per page
							// checkboxSelection // add a checkbox
							disableColumnMenu={true} // disable the column menu, including hiding columns, sorting plans
							disableRowSelectionOnClick 
						/>
					</Box>

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

			<Card sx={{p: 2, mb: 2}}>
				<CardContent>
					<Box sx={{mt: 2}}>
						<Grid container justifyContent="center">
							<Grid item>
								<Typography variant="h6" component="div">
									我報名的比賽
								</Typography>
							</Grid>
						</Grid>
					</Box>

					<Box sx={{mt: 2}}>
						<DataGrid
							// rows={rows}
							rows={[]}
							columns={columns.slice(0, 4)}
							initialState={{
								pagination: {
									paginationModel: { page: 0, pageSize: 5 },
								},

							}}
							columnVisibilityModel={{
								id: false,
								// dashboard: false,
							}}
							pageSizeOptions={[5]} // select the items show per page
							// checkboxSelection // add a checkbox
							disableColumnMenu={true} // disable the column menu, including hiding columns, sorting plans
							disableRowSelectionOnClick 
						/>
					</Box>

					{/* <Box sx={{mt: 2}}>
						<Grid container justifyContent="center">
							<Grid item>
								<Button variant="text" onClick={() => navigate("/CreateContest")} sx={{ color: "#2074d4" }}>
									<Typography variant="h6" component="div">
										創建新的比賽
									</Typography>
								</Button>
							</Grid>
						</Grid>
					</Box> */}
				</CardContent>
			</Card>
		</>
	)
}

export default ContestPage;