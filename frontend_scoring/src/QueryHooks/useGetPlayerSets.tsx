import { useQuery } from "react-query";
import axios from "axios";

export default function useGetPlayerSets(eliminationID: number) {
  return useQuery(
    ["playerSets", eliminationID],
    () => axios.get(`/api/elimination/playersets/${eliminationID}`),
    {
      staleTime: 2000,
      select: (data: any) => {
        const playerSets = data?.data.player_sets;
        return playerSets as any;
      },
    }
  );
}
