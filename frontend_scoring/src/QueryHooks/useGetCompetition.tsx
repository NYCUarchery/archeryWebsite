import { useQuery } from "react-query";
import axios from "axios";
import { Competition } from "./types/Competition";

export default function useGetCompetition(competitionID: number) {
  return useQuery(
    "competition",
    () => axios.get(`/api/competition/${competitionID}`),
    {
      staleTime: 2000,
      select: (data: any) => {
        const competition = data?.data;
        return competition as Competition;
      },
    }
  );
}
