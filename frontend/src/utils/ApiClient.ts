import { Api } from "types/Api";

export const apiClient = new Api({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_PATH,
});
