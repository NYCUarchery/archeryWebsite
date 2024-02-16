import { useQuery } from "react-query";
import axios from "axios";
import { Competition } from "./types/Competition";

export default function useGetSimpleCompetition(competitionID: number) {
  return useQuery(
    "simpleCompetition",
    () => axios.get(`/api/competition/groups/quaeli/${competitionID}`),
    {
      staleTime: 2000,
      select: (data: any) => {
        const competition = data?.data;
        return competition as Competition;
      },
    }
  );
}
