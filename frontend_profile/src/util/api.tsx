import host from "./config"
import axios from 'axios'
import formatISO from 'date-fns/formatISO';

import { setUid, resetUid, userStore, setOverview, setInstitutionID, setEmail, resetDirty, setDirty, setName, resetAllInfo } from './userReducer';
import { de } from "date-fns/locale";

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
		all: `${host}/api/competition/`,
	},
  participant: {
    join: `${host}/api/participant/`,
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

    userStore.dispatch(resetUid());
    userStore.dispatch(resetAllInfo());

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

    if (response.data.id > 0) {
      userStore.dispatch(setUid(response.data.id));
      var uid = response.data.id;
      return {result: "Success", uid: uid};
    }
    return {result: "Fail", uid: 0};
  } catch (error) {
    console.log("err: ", error);
    return {result: "Fail", uid: 0};
  }
};

const GetUserInfo = async (uid: number, successHandler?: any, failHandler?: any) => {
  try {
    if (userStore.getState().dirty > 0) {
      const response = await axios.get(`${api.user.info}/${uid}`, { withCredentials: true });
      for (const [key, value] of Object.entries(response.data.data)) {
        if (value === "") continue;
        switch (key) {
          case "name":
            userStore.dispatch(setName(response.data.name));
            break;
          case "overview":
            userStore.dispatch(setOverview(response.data.data.overview));
            break;
          case "email":
            userStore.dispatch(setEmail(response.data.data.email));
            break;
          case "institutionID":
            userStore.dispatch(setInstitutionID(response.data.data.institutionID));
            break;
        }
      }
      userStore.dispatch(resetDirty());
      return response.data.data;
    }
    else {
      const response = userStore.getState().userInfo;
      return response;
    }
    

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
    for (const [key, value] of Object.entries(values)) {

      if (value === "") continue;
      switch(key) {
        case "username":
          body.append("id", values.username);
          break;
        case "overview":
          body.append("overview", values.overview);
          break;
        case "oriPassword":
          body.append("oriPassword", values.oriPassword);
          break;
        case "password":
          body.append("modPassword", values.password);
          break;
        case "email":
          body.append("email", values.email);
          break;
        case "institutionID":
          body.append("institutionID", values.institutionID);
          break;
      }
    }

    const response = await axios.put(`${api.user.modifyInfo}/${uid}`, body, {
      withCredentials: true,
    });

    switch (response.status) {
      case 200:
        window.alert("修改成功");
        userStore.dispatch(setDirty());
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
    body.append("overview", values.overview);
    body.append("password", values.password);
    body.append("institutionID", values.institutionID);
    body.append("email", values.email);
    body.append("realName", values.realName);

    const response = await axios.post(api.user.register, body);
    if (response.status === 200)  return { result: "success" };
    return { result: "fail" };
  } catch (error: any) {
    switch (error.response.data.result) {
      case "username exists":
        window.alert("帳號已存在");
        break;
      case "email exists":
        window.alert("信箱已存在");
        break;
      case "invalid institution ID":
        window.alert("無效學校代碼");
        break;
      default:
        window.alert("未知錯誤");
        break;
    }
    return { result: error.response.data.result };
  }
};

const joinCompetition = async (competitionID: any) => {
  try {
    const body = new FormData();
    body.append("competitionID", competitionID);

    const response = await axios.post(api.participant.join, body, { withCredentials: true });

    return { result: response.data.result };
  } catch (error: any) {
    switch (error.response.data.statusText) {
      case "cannot parse competitionID": 
        window.alert("比賽ID有誤");
        break;
      case "no competition found":
        window.alert("找不到比賽");
        break;
      case "participant exists":
        window.alert("已報名過");
        break;
      case "no user found":
        window.alert("找不到使用者");
        break;
      default:
        window.alert("未知錯誤");
        break;
    }
    return { result: error.response.data.statusText };
  }
};

const getCompetitions = async () => {
  try {
    const response = await axios.get(`${api.competition.all}/`, { withCredentials: true });


    return response;
  } catch (error: any) {

    return error;
  }
};

export { Login, Logout, GetUid, GetUserInfo, ModifyUserInfo, createCompetition, registerUser, joinCompetition, getCompetitions };