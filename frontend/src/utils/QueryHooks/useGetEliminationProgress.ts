import { useQuery } from "react-query";
import { apiClient } from "@/utils/ApiClient";

/**
 * 記分頁專用的輕量對抗賽進度。
 *
 * 僅輪詢 current_stage / current_end 所在的 elimination；完整籤表與比分仍由
 * useGetEliminationDetail 的長效快取提供，故輪詢不會覆寫正在輸入的本地分數。
 */
export default function useGetEliminationProgress(
  eliminationId: number | undefined,
  enabled = true
) {
  const isEnabled =
    enabled &&
    eliminationId !== undefined &&
    Number.isInteger(eliminationId) &&
    eliminationId > 0;
  const id = eliminationId ?? -1;

  return useQuery(
    ["eliminationProgress", eliminationId],
    () => apiClient.elimination.eliminationDetail(id),
    {
      select: (data) => data.data,
      enabled: isEnabled,
      refetchInterval: isEnabled ? 2000 : false,
      refetchIntervalInBackground: false,
      staleTime: 0,
    }
  );
}
