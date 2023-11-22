import { useQuery } from "react-query";
import axios from "axios";

export default function useGetLaneWithPlayersScores(laneID: number) {
  return useQuery(
    ["laneWithPlayersScores", laneID],
    () => axios.get(`/api/lane/players/scores/${laneID}`),
    {
      staleTime: 2000,
      select: (data: any) => {
        const lane = data?.data;
        return lane as any;
      },
    }
  );
}
