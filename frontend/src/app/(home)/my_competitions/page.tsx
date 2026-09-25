"use client";
import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Pagination from "@mui/material/Pagination";
import Typography from "@mui/material/Typography";
import { useMutation } from "react-query";
import { CompetitionList } from "@/components/CompetitionList";
import NoticeSnackbars from "@/components/NoticeSnackbars";
import { apiClient } from "@/utils/ApiClient";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";
import { useGetUserId } from "@/utils/QueryHooks/useGetUserID";
import useGetUserCompetitions from "@/utils/QueryHooks/useGetUserCompetitions";
import { useRouter } from "next/navigation";
import ToCreateButton from "./ToCreateButton";

const pageSize = 5;

export default function MyCompetitionPage() {
  const [page, setPage] = useState(1);
  const [snackbarSuccess, setSnackbarSuccess] = useState(false);
  const [snackbarError, setSnackbarError] = useState(false);
  const router = useRouter();
  const { data: uid, isError: isUidError, isLoading: isLoadingUserId } = useGetUserId();
  const { data: user } = useGetCurrentUserDetail();
  const { data, isLoading, isError } = useGetUserCompetitions(
    uid!,
    (page - 1) * pageSize,
    page * pageSize - 1
  );
  const { mutate: apply } = useMutation(apiClient.participant.participantCreate, {
    onSuccess: () => setSnackbarSuccess(true),
    onError: () => setSnackbarError(true),
  });
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  useEffect(() => {
    if (isUidError) router.replace("/login?next=/my_competitions");
  }, [isUidError, router]);

  const applyFor = (competitionId: number, role: "Player" | "Judge" | "Admin") => {
    apply({ competition_id: competitionId, user_id: uid!, role });
  };

  if (isUidError) return null;

  return (
    <Box component="section" className="home-section" aria-labelledby="page-title">
      <Box className="home-section-head">
        <Box>
          <Typography component="h1" id="page-title">我的比賽</Typography>
          <Typography className="home-section-subtitle">查看您參與的比賽。</Typography>
        </Box>
        {user?.role === "Dictator" && <ToCreateButton />}
      </Box>
      {(isLoadingUserId || isLoading) && (
        <Box className="home-status" role="status">
          <CircularProgress size={28} aria-label="載入我的比賽" />
        </Box>
      )}
      {isError && <Alert severity="error">目前無法載入我的比賽。</Alert>}
      {!isLoadingUserId && !isLoading && !isError && data?.competitions.length === 0 && (
        <Box className="home-empty-state">
          <Typography component="h2">您尚未參與任何比賽</Typography>
          <Typography component="p">您可以先到比賽列表瀏覽可參加的比賽。</Typography>
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
          aria-label="我的比賽分頁"
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
