const api = {
	user: {
		login: "api/session/",
		logout: "api/session/",
		modifyInfo: "api/user",
		register: "api/user/",
		getUserID: "api/user/me",
		info: "api/user",
	},
	competition: {
		create: "api/competition/",
		join: "api/competition/join",
	},
};

const host = "http://127.0.0.1:8080";


export { host, api };

// export default api;