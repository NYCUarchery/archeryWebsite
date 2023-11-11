const api = {
	user: {
		login: "session",
		logout: "session",
		modifyInfo: "user",
		register: "user",
		getUserID: "user/me",
		info: "user",
	},
	competition: {
		create: "competition",
		join: "competition/join",
	},
};

const host = "http://"+window.location.host+"/api";


export { host, api };

// export default api;