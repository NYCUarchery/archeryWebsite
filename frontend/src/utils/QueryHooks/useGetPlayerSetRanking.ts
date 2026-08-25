import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";

export default function useGetPlayerSetRanking(eliminationId?: number) {
  return useQuery(
    ["playerSetRanking", eliminationId],
    () => apiClient.playerSet.eliminationRankingDetail(eliminationId!),
    {
      select: (response) => response.data,
      enabled: eliminationId !== undefined,
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
}
