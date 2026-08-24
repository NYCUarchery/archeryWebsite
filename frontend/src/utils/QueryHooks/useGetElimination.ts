import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";
export default function useGetElimination(
  id: number,
  groupIndex: number,
  teamSize: number
) {
  return useQuery(
    ["competitionEliminations", id, groupIndex, teamSize],
    () => apiClient.competition.groupsEliminationsDetail(id),
    {
      select: (data) => {
        return data.data.group_data?.[groupIndex]?.elimination_data?.find(
          (elimination) => elimination.team_size === teamSize
        );
      },
      staleTime: Infinity,
    }
  );
}
