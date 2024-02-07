import { useQuery } from "react-query";
import axios from "axios";
import { Competition } from "./types/Competition";
import useGetUid from "./useGetUid";

const useGetUserCompetitions = (start: number, end: number) => {
  const { data: uid } = useGetUid();
  return useQuery(
    ["userCompetitions", start, end],
    () => axios.get(`/api/competition/user/${uid}/${start}/${end}`),
    {
      enabled: !!uid,
      staleTime: Infinity,
      keepPreviousData: true,
      select: (responseData: any) => responseData?.data as Competition[],
    }
  );
};

export default useGetUserCompetitions;
