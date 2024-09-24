import { Player, RoundEnd } from "@/types/oldRef/Player";
import { apiClient } from "../ApiClient";
import { useQuery } from "react-query";
import { Lane } from "@/types/oldRef/Lane";

export interface LaneWithEnds extends Lane {
  ends: RoundEnd[];
}

export default function useGetCurrentEndWithLaneByPlayer(
  player: Player | undefined,
  currentEndIndex: number | undefined
) {
  return useQuery(
    ["currentEndWithLaneByPlayer", player?.id, currentEndIndex],
    () => apiClient.lane.scoresDetail(player?.lane_id ?? -1),
    {
      select: (data: any) => {
        const lane = data.data as Lane;
        lane.players.sort((a, b) => a.order - b.order);
        const ends = [];
        for (let i = 0; i < lane.players.length; i++) {
          const endIndex = currentEndIndex! - 1;
          const roundIndex = Math.floor(endIndex / 6);
          const end =
            lane.players![i].rounds![roundIndex].round_ends![endIndex % 6];
          ends.push(end);
        }
        return { ...lane, ends } as LaneWithEnds;
      },
      staleTime: Infinity,
      enabled: !!player && !!currentEndIndex,
    }
  );
}
