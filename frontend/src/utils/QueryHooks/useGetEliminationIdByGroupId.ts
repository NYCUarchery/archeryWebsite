import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";

// 依 group_id（而非陣列索引）於 groups-eliminations 樹中比對，取得指定隊伍規模（team_size）之 eliminationId。
// 既有 useGetElimination 以 group_data[groupIndex] 索引取組，對抗賽記分不可沿用，故另立此 hook。
export default function useGetEliminationIdByGroupId(
  competitionId: number | undefined,
  groupId: number | undefined,
  teamSize: number | undefined
) {
  return useQuery(
    ["competitionEliminationsByGroupId", competitionId, groupId, teamSize],
    () => apiClient.competition.groupsEliminationsDetail(competitionId!),
    {
      select: (data) => {
        const group = data.data.group_data?.find(
          (g) => g.group_id === groupId
        );
        return group?.elimination_data?.find((e) => e.team_size === teamSize)
          ?.elimination_id;
      },
      enabled:
        competitionId !== undefined &&
        groupId !== undefined &&
        teamSize !== undefined,
      staleTime: Infinity,
    }
  );
}
