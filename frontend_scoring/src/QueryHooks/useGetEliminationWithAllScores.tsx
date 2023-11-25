import { useQuery } from "react-query";
import axios from "axios";

export default function useGetEliminationWithAllScores(eliminationID: number) {
  return useQuery(
    ["eliminationWithAllScores", eliminationID],
    () => axios.get(`/api/elimination/cores/${eliminationID}`),
    {
      staleTime: 2000,
      select: (data: any) => {
        const elimination = data?.data;
        return elimination as any;
      },
    }
  );
}
