import { useQuery } from "react-query";
import axios from "axios";

export default function useGetEliminationWithStagesMatches(
  eliminationID: number
) {
  return useQuery(
    ["eliminationWithStagesMatches", eliminationID],
    () => axios.get(`/api/elimination/stages/matches/${eliminationID}`),
    {
      staleTime: 2000,
      select: (data: any) => {
        const stages = data?.data;
        return stages as any;
      },
    }
  );
}
