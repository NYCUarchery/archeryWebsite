
import Grid from '@mui/material/Grid';


const AboutPage = () => {
	return (
		<Grid container alignItems="stretch" justifyContent="center" sx={{ minWidth: '100vw', mt: 10}}>
			<Grid item xs={12} sm={8} sx={{p: 2}}>
				<p>
					I used to be an adventurer like you. Then I took an arrow in the knee...
				</p>
			</Grid>
		</Grid>
	)
}

export default AboutPage;