import { useQuery } from "react-query";
import axios from "axios";

export default function useGetGroupsWithPlayers(competitionID: number) {
  return useQuery(
    "groupsWithPlayers",
    () => axios.get(`/api/competition/groups/players/${competitionID}`),
    {
      select: (data: any) => {
        const groups = data?.data.groups;
        return groups as any;
      },
    }
  );
}
