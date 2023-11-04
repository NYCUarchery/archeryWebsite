import Grid from '@mui/material/Grid';

import { FC } from 'react';
interface PageContainerProps {
  children: any;
}

const PageContainer: FC<PageContainerProps> = ({children}) => {
	return (

		<Grid container alignItems="stretch" justifyContent="center" sx={{ minWidth: '100vw', mt: 10}}>
			<Grid item xs={12} sm={9} sx={{p: 2}}>
				{children}
			</Grid>
		</Grid>
	)
}


export default PageContainer;