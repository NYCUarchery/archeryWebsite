import { apiClient } from "../ApiClient";
import { useQuery } from "react-query";

const useGetEliminationOfCompetition = (
  competitionId: number,
  teamSize: number
) => {
  return useQuery(
    ["eliminationOfCompetition", competitionId],
    () => apiClient.competition.competitionGroupsQuaeliDetail(competitionId),
    {
      select: (data) => {
        return data.data.filter(
          (elimination: any) => elimination.team_size === teamSize
        );
      },
    }
  );
};

export default useGetEliminationOfCompetition;
