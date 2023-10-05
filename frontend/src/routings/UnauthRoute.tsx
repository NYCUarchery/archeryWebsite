import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';

import { Dispatch, SetStateAction, FC, useState } from 'react';
import SignupPage from '../pages/SignupPage';
import routing from '../util/routing';

interface UnauthRouteProps {
  setAuthorized: Dispatch<SetStateAction<boolean>>;
}

const UnauthRoute: FC<UnauthRouteProps> = ({setAuthorized}) => {
	const [path, setPath] = useState(routing.Login);
	const navigator = (<Navigate to={path}/>)
	return (
		<>
			{navigator}
			<Routes>
				<Route path={routing.Login} element={<LoginPage setAuthorized={setAuthorized} setPath={setPath}/>}/>
				<Route path={routing.Signup} element={<SignupPage setAuthorized={setAuthorized} setPath={setPath}/>}/>
			</Routes>
		</>
	)
}

export default UnauthRoute;