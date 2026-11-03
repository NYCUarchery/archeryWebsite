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
import type { AxiosError, AxiosResponse } from "axios";
import { apiClient } from "@/utils/ApiClient";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import { useState } from "react";
import PhaseControl, { CompetitionPhase, PhaseOption } from "./PhaseControl";

export default function Page({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const competitionId = parseInt(params.id);
  const { data: competition } = useGetCompetitionWithGroups(competitionId);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
  } = useMutation<AxiosResponse, AxiosError, boolean>(
    () => apiClient.competition.eliminationIsactivePartialUpdate(competitionId),
    {
      onMutate: () => {
        setErrorMessage(null);
        setSuccessMessage(null);
      },
      onSuccess: (response, repair) => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
        queryClient.invalidateQueries([
          "competitionEliminations",
          competitionId,
        ]);
        if (repair) {
          setSuccessMessage(
            response.status === 204
              ? "個人對抗賽資料已完整，無須補建。"
              : "個人對抗賽缺漏已補齊。"
          );
        }
      },
      onError: (error, repair) =>
        setErrorMessage(
          repair
            ? error?.response?.status === 409
              ? "個人對抗賽存在重複資料，無法自動補建。"
              : "補建個人對抗賽缺漏失敗，請稍後再試。"
            : "開啟對抗賽失敗，請稍後再試。"
        ),
    }
  );

  const {
    mutate: activateTeamElimination,
    isLoading: isActivatingTeamElimination,
  } = useMutation<AxiosResponse, AxiosError, boolean>(
    () =>
      apiClient.competition.teamEliminationIsactivePartialUpdate(competitionId),
    {
      onMutate: () => {
        setErrorMessage(null);
        setSuccessMessage(null);
      },
      onSuccess: (response, repair) => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
        queryClient.invalidateQueries([
          "competitionEliminations",
          competitionId,
        ]);
        if (repair) {
          setSuccessMessage(
            response.status === 204
              ? "團體對抗賽資料已完整，無須補建。"
              : "團體對抗賽缺漏已補齊。"
          );
        }
      },
      onError: (error, repair) =>
        setErrorMessage(
          repair
            ? error?.response?.status === 409
              ? "團體對抗賽存在重複資料，無法自動補建。"
              : "補建團體對抗賽缺漏失敗，請稍後再試。"
            : "開啟團體對抗賽失敗，請稍後再試。"
        ),
    }
  );

  const {
    mutate: activateMixedElimination,
    isLoading: isActivatingMixedElimination,
  } = useMutation<AxiosResponse, AxiosError, boolean>(
    () =>
      apiClient.competition.mixedEliminationIsactivePartialUpdate(competitionId),
    {
      onMutate: () => {
        setErrorMessage(null);
        setSuccessMessage(null);
      },
      onSuccess: (response, repair) => {
        queryClient.invalidateQueries(["competitionWithGroups", competitionId]);
        queryClient.invalidateQueries([
          "competitionEliminations",
          competitionId,
        ]);
        if (repair) {
          setSuccessMessage(
            response.status === 204
              ? "混雙對抗賽資料已完整，無須補建。"
              : "混雙對抗賽缺漏已補齊。"
          );
        }
      },
      onError: (error, repair) =>
        setErrorMessage(
          repair
            ? error?.response?.status === 409
              ? "混雙對抗賽存在重複資料，無法自動補建。"
              : "補建混雙對抗賽缺漏失敗，請稍後再試。"
            : "開啟混雙對抗賽失敗，請稍後再試。"
        ),
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
            activateElimination(false);
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
            activateTeamElimination(false);
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
            activateMixedElimination(false);
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
          {(competition?.elimination_is_active ||
            competition?.team_elimination_is_active ||
            competition?.mixed_elimination_is_active) && (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {competition?.elimination_is_active && (
                <Button
                  variant="outlined"
                  aria-label="補建個人對抗賽缺漏"
                  disabled={isActivatingElimination}
                  onClick={() => activateElimination(true)}
                >
                  個人對抗賽：補建缺漏
                </Button>
              )}
              {competition?.team_elimination_is_active && (
                <Button
                  variant="outlined"
                  aria-label="補建團體對抗賽缺漏"
                  disabled={isActivatingTeamElimination}
                  onClick={() => activateTeamElimination(true)}
                >
                  團體對抗賽：補建缺漏
                </Button>
              )}
              {competition?.mixed_elimination_is_active && (
                <Button
                  variant="outlined"
                  aria-label="補建混雙對抗賽缺漏"
                  disabled={isActivatingMixedElimination}
                  onClick={() => activateMixedElimination(true)}
                >
                  混雙對抗賽：補建缺漏
                </Button>
              )}
            </Stack>
          )}
        </Stack>
        <PhaseControl
          currentPhase={competition?.current_phase}
          options={phaseOptions}
          isUpdating={isPhaseUpdating}
          onSelect={updatePhase}
        />
      </Stack>
      <Snackbar
        open={Boolean(errorMessage || successMessage)}
        autoHideDuration={6000}
        onClose={() => {
          setErrorMessage(null);
          setSuccessMessage(null);
        }}
      >
        <Alert
          severity={errorMessage ? "error" : "success"}
          onClose={() => {
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
          sx={{ width: "100%" }}
        >
          {errorMessage || successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
