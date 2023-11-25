import { useQuery } from "react-query";
import axios from "axios";

export default function useGetUserParticipant() {
  const { data: id, isLoading, isError } = uesGetUID();

  return useQuery(
    "userParticipants",
    () => axios.get(`/api/participant/user/${id}`),
    {
      enabled: !!id || !isLoading || isError,
      staleTime: 2000,
      select: (data: any) => {
        const participants = data?.data;
        return participants as any;
      },
    }
  );
}

export function uesGetUID() {
  return useQuery("uid", () => axios.get(`/api/user/me`), {
    staleTime: 30000,
    select: (data: any) => {
      const uid = data?.data.id;
      return uid as any;
    },
  });
}
