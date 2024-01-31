import { useQuery } from "react-query";
import axios from "axios";

const useGetCompetitions = (start: number, end: number) => {
  return useQuery(
    "competitions",
    () => axios.get(`competition/current/${start}/${end}`),
    {
      staleTime: Infinity,
      select: (responseData: any) => responseData?.data,
    }
  );
};

export default useGetCompetitions;
