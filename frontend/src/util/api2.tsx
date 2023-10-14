import host from "./config"
import axios, { AxiosResponse, AxiosError } from 'axios'
import formatISO from 'date-fns/formatISO';

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

const GetUserInfo = async (uid: number, successHandler?: any, failHandler?: any) => {
	try {
    const response = await axios.get(`${host}/api/user/${uid}`, { withCredentials: true });
    console.log(response);
    return response; // Return the response data
  } catch (error: any) {
    if (!error.response) return error;
    switch (error.response.status) {
      case 400:
        window.alert("不正確的 uid");
        break;
      case 404:
        window.alert("查無此人ㄛ");
        break;
    }
    return error;
  }
}


const ModifyUserInfo = async (uid: any, values: any, successHandler?: any, failHandler?: any) => {
  try {
    const body = new FormData();
    body.append("username", values.username);
    body.append("overview", values.overview);
    body.append("oriPassword", values.oriPassword);
    body.append("modPassword", values.password);
    body.append("organization", values.organization);

    const response = await axios.put(`${host}/api/user/${uid}`, body, {
      withCredentials: true,
    });
    switch (response.status) {
      case 200:
        window.alert("修改成功");
				if (successHandler) successHandler();
        break;
      case 400:
        // window.alert("不正確的 uid");
        break;
      case 403:
        // window.alert("查無此人ㄛ");
        break;
      case 404:
        window.alert("查無此人ㄛ");
        break;
    }

    const resjson = response.data;
    if (!resjson.result) {
      return;
    }

    switch (resjson.result) {
      case "need user id":
        window.alert("需要 uid");
        break;
      case "invalid user id":
        window.alert("無效 uid");
        break;
      case "username can't be empty":
        window.alert("請輸入 username");
        break;
      case "username exists":
        window.alert("username 已存在");
        break;
      case "original password can't be empty":
        window.alert("請輸入原密碼");
        break;
      case "original & modified passwords are the same":
        window.alert("原密碼和新密碼重複");
        break;
      case "cannot change other's info":
        window.alert("不要偷改別人密碼");
        break;
      case "wrong original password":
        window.alert("不正確的原密碼");
        break;
    }
  } catch (error) {
    console.log(error);
  }
};

const createCompetition = async (values: any, successHandler?: any) => {
  try {
    const dateString = formatISO(values.date);

    const body = new FormData();
    body.append("name", values.name);
    body.append("date", dateString);
    body.append("overview", values.overview);
    body.append("organization", values.organization);
    body.append("scoreboardURL", values.scoreboardURL);

    values.categories.map((v: any, i: number) => {
      body.append("categories", JSON.stringify(v));
    });

    const response = await axios.post(`${host}/api/competition/`, body, {
      withCredentials: true,
    });

    if (response.status === 200) {
      // Handle success here
      // window.alert("創造成功");
    } else if (response.status === 400) {
      // Handle validation error here
      // window.alert("名稱、日期、資訊有誤");
    } else if (response.status === 500) {
      // Handle server error here
      window.alert("後端好像壞啦ouo 怕爆><");
    }

    const resjson = response.data;
    if (!resjson["result"]) {
      return;
    }

    switch (resjson["result"]) {
      case "competition name exists":
        window.alert("比賽名稱已存在");
        break;
      case "cannot parse date string":
        window.alert("日期字串有誤（我的問題）");
        break;
      case "invalid categories":
        window.alert("組別資料有誤（還是我的問題）");
        break;
      case "success":
        // window.alert(`大成功 id= ${resjson["compID"]}`);
        // navigate(routing.Contests);
        break;
    }
		if (response.status === 200) {
      return { success: true, compID: response.data.compID };
    }
    return { success: false, error: "Server error" };
  } catch (error) {
    console.log(error);
  }
};

export { Login, Logout, GetUid, GetUserInfo, ModifyUserInfo, createCompetition };