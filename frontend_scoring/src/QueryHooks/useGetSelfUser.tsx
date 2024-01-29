import { useQuery } from "react-query";
import axios from "axios";
import { uesGetUID } from "./uesGetUID";
import { User } from "./types/User";

export default function useGetSelfUser() {
  const { data: id, isError } = uesGetUID();

  return useQuery("selfUser", () => axios.get(`/api/user/${id}`), {
    enabled: !!id || isError,
    staleTime: Infinity,
    retry: false,
    select: (data: any) => {
      const user = data?.data.data;
      return user as User;
    },
  });
}
