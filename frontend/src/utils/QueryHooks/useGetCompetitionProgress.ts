import { useQuery } from "react-query";
import { apiClient } from "@/utils/ApiClient";

/**
 * 記分頁專用的輕量賽事狀態。
 *
 * 此端點不帶 groups / players；僅用來同步 current_phase、資格賽波次與各賽制
 * 是否開啟。完整賽事資料仍應由 useGetCompetitionWithGroups 取得，避免每兩秒
 * 重抓不會改變的關聯資料。
 */
export default function useGetCompetitionProgress(
  competitionId: number,
  enabled = true
) {
  const isEnabled = enabled && Number.isInteger(competitionId) && competitionId > 0;

  return useQuery(
    ["competitionProgress", competitionId],
    () => apiClient.competition.competitionDetail(competitionId),
    {
      select: (data) => data.data,
      enabled: isEnabled,
      refetchInterval: isEnabled ? 2000 : false,
      refetchIntervalInBackground: false,
      staleTime: 0,
    }
  );
}
