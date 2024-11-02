import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";
export default function useGetCompetitionPlayers(id: number) {
  return useQuery(
    ["competitionGroupsPlayersDetail", id],
    () => apiClient.competition.groupsPlayersDetail(id),
    {
      select: (data) => {
        const competition = data.data;
        const players = competition.groups
          ?.map((group) => group.players)
          .flat();
        return players;
      },

      staleTime: Infinity,
    }
  );
}
