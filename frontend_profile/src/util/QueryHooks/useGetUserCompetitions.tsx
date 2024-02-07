import { useQuery } from "react-query";
import axios from "axios";
import { Competition } from "./types/competition";

const useGetUserCompetitions = () => {
  return useQuery("competitions", () => axios.get("competition/user/1/0/5"), {
    staleTime: Infinity,
    keepPreviousData: true,
    select: (responseData: any) => responseData?.data as Competition[],
  });
};

export default useGetUserCompetitions;
