import { useQuery } from "react-query";
import axios from "axios";

export default function useGetQualificationWithLanesPlayers(
  qualificationID: number
) {
  return useQuery(
    ["qualificationWithLanesPlayers", qualificationID],
    () => axios.get(`/api/qualification/lanes/players/${qualificationID}`),
    {
      staleTime: 2000,
      select: (data: any) => {
        const qualification = data?.data;
        return qualification as any;
      },
    }
  );
}
