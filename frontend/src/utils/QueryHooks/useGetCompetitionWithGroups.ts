import { useQuery } from "react-query";
import { apiClient } from "@/utils/ApiClient";
export default function useGetCompetitionWithGroups(id: number) {
  return useQuery(
    ["competitionWithGroups", id],
    () => apiClient.competition.groupsDetail(id),
    {
      select: (data) => data.data,
    }
  );
}
