
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';

import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import avatar from "../assets/images/avatar.jpg";

const PersonalPage = () => {
	return (
		<Grid container alignItems="stretch" justifyContent="center" sx={{ minWidth: '100vw', mt: 10}}>
			<Grid item xs={6} sm={6}>
				<Card sx={{p: 2}}>
					<CardContent>
						<Grid container alignItems="stretch" justifyContent="center" spacing={2}>
							<Grid item xs={8}>
								<Grid container direction="column" alignItems="stretch" justifyContent="center">
									<Grid item xs={2}>
										<Typography variant="h6" component="div">
											Kenny
										</Typography>
									</Grid>
								</Grid>
							</Grid>
							<Grid item xs={4} sx={{overflow: "hidden"}}>
								<img src={avatar} alt="My Avatar" width="100px" />
							</Grid>
						</Grid>
					</CardContent>
				</Card>
			</Grid>
		</Grid>
	)
}

export default PersonalPage;