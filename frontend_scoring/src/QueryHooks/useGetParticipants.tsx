import axios from "axios";
import { useQuery } from "react-query";

export default function useGetParcipants(competitionID: number) {
  return useQuery(
    ["participants", competitionID],
    () => {
      return axios.get(`/api/competition/participants/${competitionID}`);
    },
    {
      select: (data: any) => {
        const participants = data?.data.participants;
        return participants;
      },
    }
  );
}
