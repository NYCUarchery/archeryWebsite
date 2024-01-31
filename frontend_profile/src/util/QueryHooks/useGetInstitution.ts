import { useQuery } from "react-query";
import axios from "axios";

const useGetInstitutions = () => {
  return useQuery("institutions", () => axios.get("/api/institution"), {
    staleTime: Infinity,
    select: (responseData: any) => responseData?.data,
  });
};

export default useGetInstitutions;
