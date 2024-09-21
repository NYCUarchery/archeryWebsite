import { useQuery } from "react-query";
import axios from "axios";
import { DatabaseCompetition } from "@/types/Api";

const useGetUserCompetitions = (uid: number, start: number, end: number) => {
  return useQuery(
    ["userCompetitions", start, end],
    () => axios.get(`/api/competition/user/${uid}/${start}/${end}`),
    {
      enabled: !!uid,
      staleTime: Infinity,
      keepPreviousData: true,
      select: (responseData: any) =>
        responseData?.data as DatabaseCompetition[],
    }
  );
};

export default useGetUserCompetitions;
