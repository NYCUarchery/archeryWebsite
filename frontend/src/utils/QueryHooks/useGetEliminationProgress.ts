import { useQuery } from "react-query";
import { apiClient } from "@/utils/ApiClient";

/**
 * 記分頁專用的輕量對抗賽進度。
 *
 * 輪詢輪次、波次、勝者與確認狀態；狀態改變時才重取完整比分，
 * 不以輪詢資料覆寫正在輸入的本地草稿。
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
