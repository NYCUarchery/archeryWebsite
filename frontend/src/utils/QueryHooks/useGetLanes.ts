import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";
import { Lane } from "@/types/oldRef/Lane";

export default function useGetLanes(competitionId: number) {
  return useQuery(
    ["laneAllDetail", competitionId],
    () => apiClient.lane.laneAllDetail(competitionId),
    {
      select: (data) => {
        return data.data as Lane[];
      },
      staleTime: Infinity,
    }
  );
}
