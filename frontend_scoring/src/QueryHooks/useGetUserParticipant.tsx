import { useQuery } from "react-query";
import axios from "axios";

export default function useGetUserParticipant(competitionID: number) {
  const { data: id, isError } = uesGetUID();

  return useQuery(
    "userParticipant",
    () => axios.get(`/api/participant/competition/user/${competitionID}/${id}`),
    {
      enabled: !!id || isError,
      staleTime: Infinity,
      retry: false,
      select: (data: any) => {
        const participant = data?.data[0];
        return participant as any;
      },
    }
  );
}

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
