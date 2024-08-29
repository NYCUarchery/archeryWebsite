import { Api } from "types/Api";

export const apiClient = new Api({ baseURL: window.location.origin + "/api" });
