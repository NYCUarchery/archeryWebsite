import { useQuery } from "react-query";
import { DatabaseCompetition } from "@/types/Api";
import { apiClient } from "@/utils/ApiClient";

const useGetUserCompetitions = (uid: number, start: number, end: number) => {
  return useQuery(
    ["userCompetitions", uid, start, end],
    () => apiClient.competition.userDetail(uid, start, end),
    {
      enabled: !!uid,
      staleTime: Infinity,
      keepPreviousData: true,
      select: (responseData) => ({
        competitions: responseData.data as DatabaseCompetition[],
        total: Number(responseData.headers["x-total-count"] ?? 0),
      }),
    }
  );
};

export default useGetUserCompetitions;
