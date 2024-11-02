import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";
import { Player } from "@/types/oldRef/Player";

export interface Confirmation {
  order: number;
  isConfirmed: boolean;
  endId: number;
}

export default function useGetLaneConfirmations(
  laneId: number,
  currentEndIndex: number
) {
  return useQuery(
    ["laneConfirmations", laneId, currentEndIndex],
    () => apiClient.lane.scoresDetail(laneId),
    {
      staleTime: Infinity,
      select: (data) => {
        const players = data.data.players as Player[];
        const confirmations: Confirmation[] = [];
        for (let i = 0; i < players.length; i++) {
          const endIndex = currentEndIndex - 1;
          const roundIndex = Math.floor(endIndex / 6);
          const end = players![i].rounds![roundIndex].round_ends![endIndex % 6];
          confirmations.push({
            endId: end.id,
            order: players[i].order,
            isConfirmed: end.is_confirmed,
          });
        }
        return confirmations;
      },
    }
  );
}
