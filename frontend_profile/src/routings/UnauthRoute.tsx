import { Routes, Route, useNavigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

import { useEffect } from 'react';
import SignupPage from '../pages/SignupPage';
import routing from '../util/routing';

import { GetUid } from '../util/api';

const UnauthRoute = () => {
	const navigate = useNavigate();
	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await GetUid();
				if (response?.result === "Fail") {
					navigate(routing.Login);
				}
			} catch (error) {}
		};
		fetchData();
  }, [])
	return (
		<>
			<Routes>
				<Route path={routing.Login} element={<LoginPage/>}/>
				<Route path={routing.Signup} element={<SignupPage/>}/>
			</Routes>
		</>
	)
}

export default UnauthRoute;