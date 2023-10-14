import host from "./config"
import axios, { AxiosResponse, AxiosError } from 'axios'

import { setUid, resetUid, userStore } from '../util/userReducer';

const Login = (username: string, password: string, successHandler?: any) => {
	const body = new FormData();
	body.append("username", username);
	body.append("password", password);
	fetch(`${host}/api/session/`,
		{
			method: "POST",
			body,
			credentials: "include"
		}
	)
	.then(res => {res.json(); console.log(res)})
	.then((res) => {
		console.log("Logginh successfully")
		return successHandler();
	})
	.catch((err) => {
	})
	// axios.post(
	// 	`${host}/api/session/`,
	// 	body,
	// 	{ withCredentials: true, },
	// )
	// .then((res: AxiosResponse) => {
	// 	console.log("Logginh successfully")
	// 	return successHandler();
	// })
	// .catch((err: AxiosError) => {
	// 	if (!err.response) return;
	// 	switch (err.response.status){
	// 		case 401:
	// 			window.alert("有人帳號或密碼打錯囉");
	// 			break;
	// 	}
	// })
	return;
}

const Logout = (successHandler?: any, failHandler?: any) => {
	axios.delete(`${host}/api/session/`, {
		headers: {
			withCredentials: true
		},
	})
	.then((res: any) => {
		console.log("resetUid ing")
		userStore.dispatch(resetUid());
		if (res?.result === "success") {
			if (successHandler !== undefined) successHandler()
		}
	});
	return;
}

const GetUid = (successHandler?: any, failHandler?: any) => {
	axios.get(
		`${host}/api/user/me`,
		{ withCredentials: true, },
	)
	.then((res: any) => {
		console.log("res: ", res)
		// console.log("res.data.uid: ", res.data.uid)
		if (res.data.uid) {
			userStore.dispatch(setUid(res.data.uid));
			// userStore.dispatch(setUid(-1));
			var uid = res.data.uid;
			console.log("setting uid: ", uid);
			if (successHandler !== undefined) successHandler()
			return uid;
		}
	})
	.catch((err: AxiosError) => {
		console.log("err: ", err)
		if (failHandler !== undefined) failHandler()
	})
	return 0;
}

export { Login, Logout, GetUid };