import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

import { useEffect } from 'react';
import SignupPage from '../pages/SignupPage';
import routing from '../util/routing';

import { GetUid } from '../util/api2';

const UnauthRoute = () => {
	const navigate = useNavigate();
	useEffect(() => {
		GetUid(() => {navigate(routing.Home)}, () => navigate(routing.Login))
  }, [])
	return (
		<>
			<p>UnauthRoute</p>
			<Routes>
				<Route path={routing.Login} element={<LoginPage/>}/>
				<Route path={routing.Signup} element={<SignupPage/>}/>
			</Routes>
		</>
	)
}

export default UnauthRoute;