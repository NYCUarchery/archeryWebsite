import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";
export default function useGetCompetitionGroupsWithPlayers(id: number) {
  return useQuery(
    ["competitionGroupsPlayersDetail", id],
    () => apiClient.competition.groupsPlayersDetail(id),
    {
      select: (data) => {
        return data.data.groups;
      },

      staleTime: Infinity,
    }
  );
}
