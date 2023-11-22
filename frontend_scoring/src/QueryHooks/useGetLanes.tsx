import { useQuery } from "react-query";
import axios from "axios";

export default function useGetLanes(competitionID: number) {
  return useQuery("lanes", () => axios.get(`/api/lane/all/${competitionID}`), {
    staleTime: 30000,
    select: (data: any) => {
      const lanes = data?.data;
      return lanes as any;
    },
  });
}
