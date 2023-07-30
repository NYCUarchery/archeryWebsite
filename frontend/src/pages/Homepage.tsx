
import Grid from '@mui/material/Grid';

import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';


import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';


import { useNavigate } from 'react-router-dom';

const Homepage = () => {

	const rows = [
		{
			"title": "Oh my God they kill Kenny",
			"link": "/bulletin/1"
		},

	];

  const navigate = useNavigate();

	return (
		<Grid container alignItems="stretch" justifyContent="center" sx={{ minWidth: '100vw', mt: 10}}>
			<Grid item xs={12} sm={9} sx={{p: 2}}>
				<Card sx={{p: 2}}>
					<CardContent>
						<Box>
							<Grid container justifyContent="center">
								<Grid item>
									<Typography variant="h6" component="div">
										公告欄
									</Typography>
								</Grid>
							</Grid>
						</Box>
						<Box sx={{mt: 2}}>
							<TableContainer component={Paper}>
								<Table aria-label="table">
									{/* <TableHead>
										<TableRow>
											<TableCell></TableCell>
										</TableRow>
									</TableHead> */}
									<TableBody>
										{rows.map((v, i) => (
											<TableRow
												onClick={() => {
													console.log("clicking");
													navigate(v.link);
												}}
												hover={true}
												key={i}
												sx={{ 
													'&:last-child td, &:last-child th': { border: 0 },
													"&.MuiTableRow-hover:hover": { cursor: "pointer" }
												 }}
											>
												<TableCell component="th" scope="row">
													{v.title}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>
						</Box>
					</CardContent>
				</Card>
			</Grid>
		</Grid>
	)
}

export default Homepage;