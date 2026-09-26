"use client";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMutation, useQuery } from "react-query";
import { CompetitionList } from "@/components/CompetitionList";
import NoticeSnackbars from "@/components/NoticeSnackbars";
import { DatabaseCompetition } from "@/types/Api";
import { apiClient } from "@/utils/ApiClient";
import { useGetUserId } from "@/utils/QueryHooks/useGetUserID";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";
import { useState } from "react";

const Homepage = () => {
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const [snackbarError, setSnackbarError] = useState(false);
  const { data: uid } = useGetUserId();
  const { data: user } = useGetCurrentUserDetail();
  const {
    data: competitions,
    isLoading,
    isError,
  } = useQuery(
    ["homepageCompetitions"],
    () => apiClient.competition.currentDetail(0, 2),
    {
      retry: false,
      select: (response) => response.data as DatabaseCompetition[],
    }
  );
  const { mutate: apply } = useMutation(apiClient.participant.participantCreate, {
    onSuccess: () => setSnackbarSuccess(true),
    onError: () => setSnackbarError(true),
  });

  const applyFor = (competitionId: number, role: "Player" | "Judge" | "Admin") => {
    apply({ competition_id: competitionId, user_id: uid, role });
  };

  return (
    <Box component="section" className="home-section" aria-labelledby="events-title">
      <Box className="home-section-head">
        <Typography component="h1" id="events-title">近期比賽</Typography>
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          {user?.role === "Dictator" && (
            <Button component={Link} href="/bulk_register" className="home-button-primary">
              管理員批次註冊
            </Button>
          )}
          <Link className="home-text-button" href="/recent_competitions">查看全部比賽</Link>
        </Box>
      </Box>
      {isLoading && (
        <Box className="home-status" role="status">
          <CircularProgress size={28} aria-label="載入近期比賽" />
        </Box>
      )}
      {isError && <Alert severity="error">目前無法載入近期比賽。</Alert>}
      {!isLoading && !isError && competitions?.length === 0 && (
        <Box className="home-empty-state">
          <Typography component="h2">目前沒有近期比賽</Typography>
        </Box>
      )}
      {!isLoading && !isError && competitions && competitions.length > 0 && (
        <Box className="home-event-grid">
          <CompetitionList
            competitions={competitions}
            uid={uid}
            variant="card"
            onPlayerApply={(competitionId) => applyFor(competitionId, "Player")}
            onJudgeApply={(competitionId) => applyFor(competitionId, "Judge")}
            onAdminApply={(competitionId) => applyFor(competitionId, "Admin")}
          />
        </Box>
      )}
      <Box component="aside" className="home-notice" aria-labelledby="notice-title">
        <Box className="home-notice-mark" aria-hidden="true">i</Box>
        <Box>
          <Typography component="h2" id="notice-title">公告</Typography>
          <Typography component="p">目前沒有公告。</Typography>
        </Box>
      </Box>
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
};

export default Homepage;
