import { useQuery } from "react-query";
import axios from "axios";

const useGetCompetitions = (start: number, end: number) => {
  return useQuery(
    ["competitions", start, end],
    () => axios.get(`/api/competition/current/${start}/${end}`),
    {
      staleTime: Infinity,
      keepPreviousData: true,
      select: (responseData: any) => responseData?.data,
    }
  );
};

export default useGetCompetitions;
