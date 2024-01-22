import { useQuery } from "react-query";
import axios from "axios";
import { Lane } from "./types/Lane";

export default function useGetLaneWithPlayersScores(laneID: number) {
  return useQuery(
    ["laneWithPlayersScores", laneID],
    () => axios.get(`/api/lane/scores/${laneID}`),
    {
      staleTime: 2000,
      select: (data: any) => {
        const lane = data?.data;
        return lane as Lane;
      },
    }
  );
}
