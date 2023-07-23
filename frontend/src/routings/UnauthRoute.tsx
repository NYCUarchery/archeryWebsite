import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

import { Dispatch, SetStateAction, FC  } from 'react';
import SignupPage from '../pages/SignupPage';

interface UnauthRouteProps {
  setAuthorized: Dispatch<SetStateAction<boolean>>;
}

const UnauthRoute: FC<UnauthRouteProps> = ({setAuthorized}) => {
	return (
		<>
			{window.location.href == "/Signup"? <Navigate to="/Signup" />:<Navigate to="/Login" />}
			<Routes>
				<Route path={'/Login'} element={<LoginPage setAuthorized={setAuthorized}/>}/>
				<Route path={'/Signup'} element={<SignupPage />}/>
			</Routes>
		</>
	)
}

export default UnauthRoute;