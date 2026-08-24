import { Player, RoundEnd } from "@/types/oldRef/Player";
import { apiClient } from "../ApiClient";
import { useQuery } from "react-query";
import { Lane } from "@/types/oldRef/Lane";
import { DatabaseRoundEnd } from "@/types/Api";
import { UseQueryOptions } from "react-query";

export interface LaneWithEnds extends Lane {
  ends: RoundEnd[];
}

export default function useGetCurrentEndWithLaneByPlayer(
  player: Player | undefined,
  currentEndIndex: number | undefined,
  onSuccess?: UseQueryOptions<LaneWithEnds, unknown>["onSuccess"]
) {
  return useQuery(
    ["currentEndWithLaneByPlayer", player?.id, currentEndIndex],
    () => apiClient.lane.scoresDetail(player?.lane_id ?? -1),
    {
      select: (data: any) => {
        const lane = data.data as Lane;
        // Sort a copy: the array belongs to the react-query cache.
        const players = [...lane.players].sort((a, b) => a.order - b.order);
        const ends: DatabaseRoundEnd[] = [];
        const endIndex = currentEndIndex!;
        const roundIndex = Math.floor(endIndex / 6);
        if (endIndex < 0 || players[0]?.rounds?.[roundIndex] == undefined) {
          return { ...lane, players, ends } as LaneWithEnds;
        }
        for (let i = 0; i < players.length; i++) {
          const end = players[i].rounds![roundIndex].round_ends![endIndex % 6];
          ends.push(end);
        }
        return { ...lane, players, ends } as LaneWithEnds;
      },
      enabled: !!player,
      onSuccess: onSuccess,
    }
  );
}
