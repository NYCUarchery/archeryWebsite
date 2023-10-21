import host from "./config";

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

export default api;