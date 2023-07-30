import { Routes, Route } from 'react-router-dom';
import Homepage from '../pages/Homepage';
import PersonalPage from '../pages/PersonalPage';
import AboutPage from '../pages/AboutPage';
import ContestPage from '../pages/ContestPage';

const PageRoute = () => {
	return (
		<Routes>
			<Route path={'/'} element={<Homepage/>}/>
			<Route path={'/PersonalPage'} element={<PersonalPage/>}/>
			<Route path={'/Abouts'} element={<AboutPage/>}/>
			<Route path={'/Contests'} element={<ContestPage/>}/>
		</Routes>
	)
}

export default PageRoute;