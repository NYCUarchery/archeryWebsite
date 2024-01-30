import { useQuery } from "react-query";
import axios from "axios";
import { Player } from "./types/Player";

export default function useGetPlayerWithScores(playerID: number) {
  return useQuery(
    ["playerWithScores", playerID],
    () => axios.get(`/api/player/scores/${playerID}`),
    {
      staleTime: 2000,
      select: (data: any) => {
        const player = data?.data;
        return player as Player;
      },
    }
  );
}
