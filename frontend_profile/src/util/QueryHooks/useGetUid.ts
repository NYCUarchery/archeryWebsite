import { useQuery } from "react-query";
import axios from "axios";

const useGetUid = () => {
  return useQuery("Uid", () => axios.get("/api/user/me"), {
    staleTime: 300000,
    select: (responseData: any) => responseData?.data?.id as number,
  });
};

export default useGetUid;
