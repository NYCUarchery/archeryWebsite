"use client";
import { useState } from "react";

import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Pagination from "@mui/material/Pagination";

import { CompetitionList } from "@/components/CompetitionList";
import { useGetUserId } from "@/utils/QueryHooks/useGetUserID";
import useGetUserCompetitions from "@/utils/QueryHooks/useGetUserCompetitions";
import { useRouter } from "next/navigation";
import ToCreateButton from "./ToCreateButton";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";
import NoticeSnackbars from "@/components/NoticeSnackbars";
import { apiClient } from "@/utils/ApiClient";
import { useMutation } from "react-query";

export default function MyCompetitionPage() {
  const [page, setPage] = useState(1);
  const [startIndex, setStartIndex] = useState((page - 1) * 5);
  const [endIndex, setEndIndex] = useState(page * 5 - 1);
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const [snackbarError, setSnackbarError] = useState(false);
  const { data: uid, isError: isUidError } = useGetUserId();
  const { data: user } = useGetCurrentUserDetail();
  const { data: competitions, isLoading: isLoadingCompetitions } =
    useGetUserCompetitions(uid as number, startIndex, endIndex);

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

  const handleJudgeApplication = (competitionId: number) => {
    apply({
      competition_id: competitionId,
      user_id: uid,
      role: "Judge",
    });
  };

  const handleSnackbarsClose = () => {
    setSnackbarSuccess(false);
    setSnackbarError(false);
  };

  const router = useRouter();

  if (isUidError) {
    router.push("/recent_competitions");
  }

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    setStartIndex((value - 1) * 5);
    setEndIndex(value * 5 - 1);
  };

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <CardContent>
        <Grid container justifyContent="center">
          <Grid>
            <Typography variant="h5" component="div">
              我的比賽
            </Typography>
          </Grid>
        </Grid>
        {user?.role == "Dictator" ? <ToCreateButton /> : null}
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
            onJudgeApply={handleJudgeApplication}
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
