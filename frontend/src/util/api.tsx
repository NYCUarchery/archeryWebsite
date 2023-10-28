import host from "./config"
import axios from 'axios'
import formatISO from 'date-fns/formatISO';

import { setUid, resetUid, userStore } from './userReducer';

const api = {
	user: {
		login: `${host}/api/session/`,
		logout: `${host}/api/session/`,
		modifyInfo: `${host}/api/user`,
		register: `${host}/api/user/`,
		getUserID: `${host}/api/user/me`,
		info: `${host}/api/user`,
	},
	competition: {
		create: `${host}/api/competition/`,
		join: `${host}/api/competition/join`,
	},
};


const Login = async (username: string, password: string, successHandler?: any) => {
  try {
    const body = new FormData();
    body.append("username", username);
    body.append("password", password);

    const response = await axios.post(api.user.login, body, {
      withCredentials: true,
    });

    console.log("Logging successfully");

    if (successHandler) successHandler();
    return {result: "Success"}
  } catch (error: any) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          window.alert("有人帳號或密碼打錯囉");
          break;
      }
    }
    return {result: "Fail"}
  }
};

const Logout = async (successHandler?: any, failHandler?: any) => {
  try {
    const response = await axios.delete(api.user.logout, {
      withCredentials: true,
    });

    console.log("resetUid ing");
    userStore.dispatch(resetUid());

    if (response?.data?.result === "success" && successHandler) {
      successHandler();
    }

  } catch (error) {
    console.log(error);
    if (failHandler) failHandler();
  }
};

const GetUid = async (successHandler?: any, failHandler?: any) => {
  try {
    const response = await axios.get(api.user.getUserID, {
      withCredentials: true,
    });

    console.log("res: ", response);

    if (response.data.uid) {
      userStore.dispatch(setUid(response.data.uid));
      var uid = response.data.uid;
      console.log("setting uid: ", uid);

      if (successHandler) successHandler();

      return uid;
    }

  } catch (error) {
    console.log("err: ", error);
    if (failHandler) failHandler();
  }

  return 0;
};

const GetUserInfo = async (uid: number, successHandler?: any, failHandler?: any) => {
  try {
    const response = await axios.get(`${api.user.info}/${uid}`, { withCredentials: true });

    console.log(response);

    return response;
  } catch (error: any) {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          window.alert("不正確的 uid");
          break;
        case 404:
          window.alert("查無此人ㄛ");
          break;
      }
    }

    return error;
  }
};

const ModifyUserInfo = async (uid: any, values: any, successHandler?: any, failHandler?: any) => {
  try {
    const body = new FormData();
    body.append("username", values.username);
    body.append("overview", values.overview);
    body.append("oriPassword", values.oriPassword);
    body.append("modPassword", values.password);
    body.append("organization", values.organization);

    const response = await axios.put(`${api.user.modifyInfo}/${uid}`, body, {
      withCredentials: true,
    });

    switch (response.status) {
      case 200:
        window.alert("修改成功");
        if (successHandler) successHandler();
        break;
      case 400:
        break;
      case 403:
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

    const response = await axios.post(api.competition.create, body, {
      withCredentials: true,
    });

    if (response.status === 200) {
    } else if (response.status === 400) {
    } else if (response.status === 500) {
      window.alert("後端好像壞啦ouo 怕爆><");
    }

    const resjson = response.data;

    if (!resjson.result) {
      return;
    }

    switch (resjson.result) {
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
        break;
    }
		if (response.status === 200) {
      return { success: true, compID: response.data.compID };
    }

    return { success: false, error: "Server error" };
  } catch (error: any) {
    console.log(error);
		return { success: false, error: error.message };
  }
};

const registerUser = async (values: any) => {
  try {
    const body = new FormData();
    body.append("username", values.username);
    body.append("password", values.password);
    body.append("overview", values.overview);
    body.append("organization", values.organization);

    const response = await axios.post(api.user.register, body);

    if (response.status === 200) {
      return { success: true };
    }

    return { success: false, error: "Server error" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

const joinCompetition = async () => {
  try {
    const body = new FormData();
    body.append("competitionID", "aaaa"); // Replace "aaaa" with the actual competition ID

    const response = await fetch(api.competition.join, {
      method: "POST",
      credentials: "include",
      body: body,
    });

    const resjson = await response.json();

    return resjson;
  } catch (error: any) {
    console.log(error);
    return { error: error.message };
  }
};

export { Login, Logout, GetUid, GetUserInfo, ModifyUserInfo, createCompetition, registerUser, joinCompetition };