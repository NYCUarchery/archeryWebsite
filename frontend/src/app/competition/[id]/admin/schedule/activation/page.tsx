"use client";
import { Box, Button, ButtonGroup } from "@mui/material";
import { useMutation, useQueryClient } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";

export default function Page({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const competitionId = parseInt(params.id);
  const { data: competition } = useGetCompetitionWithGroups(competitionId);
  const { mutate: activateQualification } = useMutation(
    (id: number) =>
      apiClient.competition.competitionQualificationisactiveUpdate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
      },
    }
  );

  const { mutate: activateElimination } = useMutation(
    (id: number) =>
      apiClient.competition.competitionEliminationisactiveUpdate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
      },
    }
  );

  const { mutate: activateTeamElimination } = useMutation(
    (id: number) =>
      apiClient.competition.competitionTeameliminationisactiveUpdate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
      },
    }
  );

  const { mutate: activateMixedElimination } = useMutation(
    (id: number) =>
      apiClient.competition.competitionMixedeliminationisactiveUpdate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
      },
    }
  );

  const flags = competition
    ? [
        {
          name: "資格賽",
          isActive: competition.qualification_is_active,
          handleClick: () => {
            if (competition.qualification_is_active) {
              return;
            }
            activateQualification(competitionId);
          },
        },
        {
          name: "對抗賽",
          isActive: competition.elimination_is_active,
          handleClick: () => {
            if (competition.elimination_is_active) {
              return;
            }
            activateElimination(competitionId);
          },
        },
        {
          name: "團體對抗賽",
          isActive: competition.team_elimination_is_active,
          handleClick: () => {
            if (competition.team_elimination_is_active) {
              return;
            }
            activateTeamElimination(competitionId);
          },
        },
        {
          name: "混雙對抗賽",
          isActive: competition.mixed_elimination_is_active,
          handleClick: () => {
            if (competition.mixed_elimination_is_active) {
              return;
            }
            activateMixedElimination(competitionId);
          },
        },
      ]
    : [];

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        margin: "50px 0",
      }}
    >
      <ButtonGroup>
        {flags.map((flag) => (
          <Button
            key={flag.name}
            variant="contained"
            color={flag.isActive ? "success" : "info"}
            onClick={flag.handleClick}
          >
            {flag.name}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
}
