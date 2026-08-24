"use client";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import { useState } from "react";
import PhaseControl, { CompetitionPhase, PhaseOption } from "./PhaseControl";

export default function Page({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const competitionId = parseInt(params.id);
  const { data: competition } = useGetCompetitionWithGroups(competitionId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    mutate: activateQualification,
    isLoading: isActivatingQualification,
  } = useMutation(
    (id: number) =>
      apiClient.competition.qualificationIsactivePartialUpdate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
      },
      onError: () => setErrorMessage("開啟資格賽失敗，請稍後再試。"),
    }
  );

  const {
    mutate: activateElimination,
    isLoading: isActivatingElimination,
  } = useMutation(
    (id: number) => apiClient.competition.eliminationIsactivePartialUpdate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
      },
      onError: () => setErrorMessage("開啟對抗賽失敗，請稍後再試。"),
    }
  );

  const {
    mutate: activateTeamElimination,
    isLoading: isActivatingTeamElimination,
  } = useMutation(
    (id: number) =>
      apiClient.competition.teamEliminationIsactivePartialUpdate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
        queryClient.invalidateQueries([
          "competitionEliminations",
          competitionId,
        ]);
      },
      onError: () => setErrorMessage("開啟團體對抗賽失敗，請稍後再試。"),
    }
  );

  const {
    mutate: activateMixedElimination,
    isLoading: isActivatingMixedElimination,
  } = useMutation(
    (id: number) =>
      apiClient.competition.mixedEliminationIsactivePartialUpdate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
        queryClient.invalidateQueries([
          "competitionEliminations",
          competitionId,
        ]);
      },
      onError: () => setErrorMessage("開啟混雙對抗賽失敗，請稍後再試。"),
    }
  );

  const {
    mutate: updatePhase,
    isLoading: isPhaseUpdating,
  } = useMutation(
    (phase: CompetitionPhase) =>
      apiClient.competition.currentPhasePartialUpdate(competitionId, {
        current_phase: phase,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
        queryClient.invalidateQueries(["competitionProgress", competitionId]);
      },
      onError: () => {
        setErrorMessage("切換選手目前畫面失敗，請稍後再試。");
      },
    }
  );

  const flags = competition
    ? [
        {
          name: "資格賽",
          isActive: competition.qualification_is_active,
          isLoading: isActivatingQualification,
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
          isLoading: isActivatingElimination,
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
          isLoading: isActivatingTeamElimination,
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
          isLoading: isActivatingMixedElimination,
          handleClick: () => {
            if (competition.mixed_elimination_is_active) {
              return;
            }
            activateMixedElimination(competitionId);
          },
        },
      ]
    : [];

  const phaseOptions: PhaseOption[] = competition
    ? [
        {
          phase: 0,
          label: "資格賽",
          isActive: competition.qualification_is_active,
        },
        {
          phase: 1,
          label: "對抗賽",
          isActive: competition.elimination_is_active,
        },
        {
          phase: 2,
          label: "團體對抗賽",
          isActive: competition.team_elimination_is_active,
        },
        {
          phase: 3,
          label: "混雙對抗賽",
          isActive: competition.mixed_elimination_is_active,
        },
      ]
    : [];

  return (
    <Box sx={{ width: "100%", maxWidth: 960, margin: "50px auto", px: 3 }}>
      <Stack spacing={4}>
        <Stack spacing={1.5}>
          <Typography variant="h6">開啟</Typography>
          <Typography variant="body2" color="text.secondary">
            開啟後不能關閉；下方的選手目前畫面才可切換到該賽制。
          </Typography>
          <ButtonGroup aria-label="開啟賽程">
            {flags.map((flag) => (
              <Button
                key={flag.name}
                variant="contained"
                color={flag.isActive ? "success" : "info"}
                disabled={flag.isActive || flag.isLoading}
                onClick={flag.handleClick}
              >
                {flag.name}
              </Button>
            ))}
          </ButtonGroup>
        </Stack>
        <PhaseControl
          currentPhase={competition?.current_phase}
          options={phaseOptions}
          isUpdating={isPhaseUpdating}
          onSelect={updatePhase}
        />
      </Stack>
      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
      >
        <Alert
          severity="error"
          onClose={() => setErrorMessage(null)}
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
