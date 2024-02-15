import { useQuery } from "react-query";
import axios from "axios";
import { Institution } from "./types/Institution";

const useGetInstitutions = () => {
  return useQuery("institutions", () => axios.get("/api/institution"), {
    staleTime: Infinity,
    select: (responseData: any) => responseData?.data as Institution[],
  });
};

export default useGetInstitutions;
