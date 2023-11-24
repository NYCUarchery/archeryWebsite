import { useQuery } from "react-query";
import axios from "axios";

export default function useGetPlayerSetWithPlayers(playerSetID: number) {
  return useQuery(
    ["playerSetWithPlayers", playerSetID],
    () => axios.get(`/api/playerset/${playerSetID}`),
    {
      select: (data: any) => {
        const playerSet = data?.data;
        return playerSet as any;
      },
    }
  );
}
