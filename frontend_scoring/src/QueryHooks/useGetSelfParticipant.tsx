import { useQuery } from "react-query";
import axios from "axios";
import { uesGetUID } from "./uesGetUID";
import { Participant } from "./types/Participant";

export default function useGetSelfParticipant(competitionID: number) {
  const { data: id, isError } = uesGetUID();

  return useQuery(
    "selfParticipant",
    () => axios.get(`/api/participant/competition/user/${competitionID}/${id}`),
    {
      enabled: !!id || isError,
      staleTime: Infinity,
      retry: false,
      select: (data: any) => {
        const participant = data?.data[0];
        return participant as Participant;
      },
    }
  );
}
