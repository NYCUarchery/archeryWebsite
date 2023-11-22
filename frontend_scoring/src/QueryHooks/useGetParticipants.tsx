import axios from "axios";
import { useQuery } from "react-query";

export default function useGetParcipants(competitionID: number) {
  return useQuery(
    ["participants", competitionID],
    () => {
      return axios.get(`/api/participant/competition/${competitionID}`);
    },
    {
      staleTime: 2000,
      select: (data: any) => {
        const participants = data?.data;
        return participants;
      },
    }
  );
}
