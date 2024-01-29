import { useQuery } from "react-query";
import axios from "axios";

export function uesGetUID() {
  return useQuery("uid", () => axios.get(`/api/user/me`), {
    staleTime: Infinity,
    retry: false,

    select: (data: any) => {
      const uid = data?.data.id;
      return uid as any;
    },
  });
}
