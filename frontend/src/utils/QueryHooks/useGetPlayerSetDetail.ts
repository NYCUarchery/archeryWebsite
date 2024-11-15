import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";
export default function useGetPlayerSetDetail(player_set_id?: number) {
  return useQuery(
    ["playerSetDetail", player_set_id],
    () => apiClient.playerSet.playersetDetail(player_set_id!),
    {
      select: (data) => {
        return data.data;
      },
      enabled: player_set_id !== undefined,
    }
  );
}
