import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";

export default function useGetEliminationDetail(
  eliminationId: number | undefined
) {
  return useQuery(
    ["eliminationDetail", eliminationId],
    () => apiClient.elimination.stagesScoresMedalsDetail(eliminationId!),
    {
      select: (data) => data.data,
      staleTime: Infinity,
      enabled: !!eliminationId,
    }
  );
}
