"use client";
import { useState } from "react";

import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import Pagination from "@mui/material/Pagination";
import { CompetitionList } from "@/components/CompetitionList";
import NoticeSnackbars from "@/components/NoticeSnackbars";
import { useQuery } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import { DatabaseCompetition } from "@/types/Api";
import { useGetUserId } from "@/utils/QueryHooks/useGetUserID";
import { useMutation } from "react-query";

export default function RecentCompetitionPage() {
  const [page, setPage] = useState(1);
  const [startIndex, setStartIndex] = useState((page - 1) * 5);
  const [endIndex, setEndIndex] = useState(page * 5 - 1);
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const [snackbarError, setSnackbarError] = useState(false);
  const { data: uid } = useGetUserId();

  const { data: competitions, isLoading: isLoadingCompetitions } = useQuery(
    "competitions",
    () => apiClient.competition.currentDetail(startIndex, endIndex),
    {
      retry: false,
      select: (data) => data.data as unknown as DatabaseCompetition[],
    }
  );
  const { mutate: apply } = useMutation(
    apiClient.participant.participantCreate,

    {
      onSuccess: () => {
        setSnackbarSuccess(true);
      },
      onError: () => {
        setSnackbarError(true);
      },
    }
  );

  const handlePlayeApplication = (competitionId: number) => {
    apply({
      competition_id: competitionId,
      user_id: uid,
      role: "Player",
    });
  };

  const handleAdminApplication = (competitionId: number) => {
    apply({
      competition_id: competitionId,
      user_id: uid,
      role: "Admin",
    });
  };

  const handleSnackbarsClose = () => {
    setSnackbarSuccess(false);
    setSnackbarError(false);
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    setStartIndex((value - 1) * 5);
    setEndIndex(value * 5 - 1);
  };

  return (
    <Card sx={{ p: 2, mb: 2, maxWidth: "600px" }}>
      <CardContent>
        <Grid container justifyContent="center">
          <Grid>
            <Typography variant="h5" component="div">
              近期比賽
            </Typography>
          </Grid>
        </Grid>
        <Pagination
          count={10}
          color="primary"
          onChange={handlePageChange}
          page={page}
          sx={{ display: "flex", justifyContent: "center" }}
        />
        {competitions?.length === 0 && <h2>沒有更多比賽了喲 ;(</h2>}
        {isLoadingCompetitions || !competitions ? (
          <p>loading...</p>
        ) : (
          <CompetitionList
            competitions={competitions}
            uid={uid}
            onPlayerApply={handlePlayeApplication}
            onAdminApply={handleAdminApplication}
          />
        )}
        <NoticeSnackbars
          isSuccess={snackbarSuccess}
          successMessage="申請成功!"
          isError={snackbarError}
          errorMessage="申請失敗!可能是網路狀況不佳或是您已經在比賽內。"
          onClose={handleSnackbarsClose}
        />
        <Pagination
          count={10}
          color="primary"
          onChange={handlePageChange}
          page={page}
          sx={{ display: "flex", justifyContent: "center" }}
        />
      </CardContent>
    </Card>
  );
}
