"use client";
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Pagination from "@mui/material/Pagination";
import Typography from "@mui/material/Typography";
import { useMutation, useQuery } from "react-query";
import { CompetitionList } from "@/components/CompetitionList";
import NoticeSnackbars from "@/components/NoticeSnackbars";
import { DatabaseCompetition } from "@/types/Api";
import { apiClient } from "@/utils/ApiClient";
import { useGetUserId } from "@/utils/QueryHooks/useGetUserID";

const pageSize = 5;

export default function RecentCompetitionPage() {
  const [page, setPage] = useState(1);
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const [snackbarError, setSnackbarError] = useState(false);
  const { data: uid } = useGetUserId();
  const { data, isLoading, isError } = useQuery(
    ["competitions", page],
    () => apiClient.competition.currentDetail((page - 1) * pageSize, page * pageSize - 1),
    {
      retry: false,
      keepPreviousData: true,
      select: (response) => ({
        competitions: response.data as DatabaseCompetition[],
        total: Number(response.headers["x-total-count"] ?? 0),
      }),
    }
  );
  const { mutate: apply } = useMutation(apiClient.participant.participantCreate, {
    onSuccess: () => setSnackbarSuccess(true),
    onError: () => setSnackbarError(true),
  });
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  const applyFor = (competitionId: number, role: "Player" | "Judge" | "Admin") => {
    apply({ competition_id: competitionId, user_id: uid, role });
  };

  return (
    <Box component="section" className="home-section" aria-labelledby="page-title">
      <Box className="home-section-head">
        <Box>
          <Typography component="h1" id="page-title">比賽列表</Typography>
          <Typography className="home-section-subtitle">瀏覽比賽與記分板，登入後可申請加入。</Typography>
        </Box>
      </Box>
      {isLoading && (
        <Box className="home-status" role="status">
          <CircularProgress size={28} aria-label="載入比賽列表" />
        </Box>
      )}
      {isError && <Alert severity="error">目前無法載入比賽列表。</Alert>}
      {!isLoading && !isError && data?.competitions.length === 0 && (
        <Box className="home-empty-state">
          <Typography component="h2">目前沒有比賽</Typography>
        </Box>
      )}
      {!isLoading && !isError && data && data.competitions.length > 0 && (
        <Box className="home-competition-list">
          <CompetitionList
            competitions={data.competitions}
            uid={uid}
            onPlayerApply={(competitionId) => applyFor(competitionId, "Player")}
            onJudgeApply={(competitionId) => applyFor(competitionId, "Judge")}
            onAdminApply={(competitionId) => applyFor(competitionId, "Admin")}
          />
        </Box>
      )}
      {totalPages > 1 && (
        <Pagination
          className="home-pagination"
          count={totalPages}
          color="primary"
          onChange={(_event, value) => setPage(value)}
          page={page}
          aria-label="比賽列表分頁"
        />
      )}
      <NoticeSnackbars
        isSuccess={snackbarSuccess}
        successMessage="申請成功!"
        isError={snackbarError}
        errorMessage="申請失敗!可能是網路狀況不佳或是您已經在比賽內。"
        onClose={() => {
          setSnackbarSuccess(false);
          setSnackbarError(false);
        }}
      />
    </Box>
  );
}
