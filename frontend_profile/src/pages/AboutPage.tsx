
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';


const AboutPage = () => {
	return (
		<>
			<Card sx={{p: 2, mb: 2}}>
				<CardContent>
					<Box sx={{mt: 2}}>
						<Grid container justifyContent="center">
							<Grid item>
								<Typography variant="h6" component="div">
								</Typography>
							</Grid>
						</Grid>
					</Box>
				</CardContent>
			</Card>
			{/* <Card sx={{p: 2, mb: 2}}>
				<CardContent>
					<Box sx={{mt: 2}}>
						<Grid container justifyContent="center">
							<Grid item>
								<Typography variant="h6" component="div">
									射箭是什麼
								</Typography>
							</Grid>
						</Grid>
					</Box>
					射箭（英語：archery）又稱為箭術，是藉助弓或弩的彈力將箭射出的一種技藝，最初是用作狩獵之用，後來應用到軍事上。世界各地均有不同的傳統射箭方法，有些地區更發展 ...查看更多
				</CardContent>
			</Card>

			<Card sx={{p: 2, mb: 2}}>
				<CardContent>
					<Box sx={{mt: 2}}>
						<Grid container justifyContent="center">
							<Grid item>
								<Typography variant="h6" component="div">
									來自一位不知名的衛兵
								</Typography>
							</Grid>
						</Grid>
					</Box>
					I used to be an adventurer like you. Then I took an arrow in the knee...
				</CardContent>
			</Card> */}
		</>
	)
}

export default AboutPage;