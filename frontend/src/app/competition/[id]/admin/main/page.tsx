"use client";

import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import { apiClient } from "@/utils/ApiClient";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQueryClient } from "react-query";

export default function Page({ params }: { params: { id: string } }) {
  const competitionId = Number(params.id);
  const { data: competition } = useGetCompetitionWithGroups(competitionId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { mutate: deleteCompetition, isError, isLoading, reset } = useMutation(
    () => apiClient.competition.competitionDelete(competitionId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["userCompetitions"]);
        router.replace("/my_competitions");
      },
    },
  );

  const openDialog = () => {
    reset();
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (!isLoading) setDialogOpen(false);
  };

  return (
    <Box component="section" sx={{ p: 2 }} aria-labelledby="danger-zone-title">
      <Typography component="h1" id="danger-zone-title" variant="h5" gutterBottom>
        危險操作
      </Typography>
      <Typography sx={{ mb: 2 }}>軟刪除後，這場比賽不會再出現在一般列表。</Typography>
      <Button color="error" variant="contained" onClick={openDialog}>
        刪除比賽
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        aria-labelledby="soft-delete-competition-title"
      >
        <DialogTitle id="soft-delete-competition-title">
          刪除「{competition?.title ?? "此比賽"}」？
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            此操作會隱藏比賽，但會保留所有組別、參加者與成績資料。若要復原，需由資料庫將 deleted_at 設回 NULL。
          </DialogContentText>
          {isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              刪除失敗，請確認您仍是此比賽已核准的管理員後再試。
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={isLoading} onClick={closeDialog}>
            取消
          </Button>
          <Button
            color="error"
            disabled={isLoading}
            onClick={() => deleteCompetition()}
          >
            {isLoading ? "刪除中…" : "確認軟刪除"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
