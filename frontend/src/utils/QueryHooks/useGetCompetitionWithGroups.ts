import { useQuery } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import { Competition } from "@/types/oldRef/Competition";
export default function useGetCompetitionWithGroups(id: number) {
  return useQuery(
    ["competitionWithGroups", id],
    () => apiClient.competition.groupsDetail(id),
    {
      select: (data) => data.data as unknown as Competition,
      staleTime: 60000 * 30,
    }
  );
}
