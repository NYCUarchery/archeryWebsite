import { useQuery } from "react-query";
import axios from "axios";
import { Competition } from "./types/Competition";

const useGetCompetitions = (start: number, end: number) => {
  return useQuery(
    ["competitions", start, end],
    () => axios.get(`/api/competition/current/${start}/${end}`),
    {
      staleTime: Infinity,
      keepPreviousData: true,
      select: (responseData: any) => responseData?.data as Competition[],
    }
  );
};

export default useGetCompetitions;
