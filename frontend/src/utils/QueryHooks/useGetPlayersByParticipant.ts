import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";
import { Player } from "@/types/oldRef/Player";
import { Group } from "@/types/oldRef/Competition";

export default function useGetPlayersByParticipant(
  participantId: number,
  competitionId: number
) {
  return useQuery(
    ["competitionGroupsPlayersDetail", competitionId],
    () => apiClient.competition.competitionGroupsPlayersDetail(competitionId),
    {
      select: (data) => {
        const groups = data.data.groups as unknown as Group[];
        const players = groups.map((group) => {
          const player = group.players.find(
            (player: Player) => player.participant_id === participantId
          );
          return player;
        });
        return players.filter((player) => player !== undefined) as Player[];
      },
      staleTime: Infinity,
    }
  );
}
