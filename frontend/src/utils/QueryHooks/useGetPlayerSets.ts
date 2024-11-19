import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";
export default function useGetPlayerSets(elimination_id?: number) {
  return useQuery(
    ["playerSets", elimination_id],
    () => apiClient.elimination.playersetsDetail(elimination_id!),
    {
      select: (data) => {
        return data.data.player_sets;
      },
      enabled: elimination_id !== undefined,
      staleTime: Infinity,
    }
  );
}
