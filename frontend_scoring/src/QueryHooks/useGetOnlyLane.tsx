import { useQuery } from "react-query";
import axios from "axios";
import { Lane } from "./types/Lane";

export default function useGetOnlyLane(laneID: number) {
  return useQuery(
    ["lane", laneID],
    async () => await axios.get(`/api/lane/${laneID}`),
    {
      staleTime: 2000,
      select: (data: any) => {
        const lane = data?.data;
        return lane as Lane;
      },
    }
  );
}
