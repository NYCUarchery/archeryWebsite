"use client";

import axios from "axios";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "react-query";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";

const qualificationAssignmentsApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/",
});

type PreviewRow = {
  line: number;
  player_name: string;
  group_name: string;
  position: string;
  player_id: number;
  group_id: number;
  lane_number: number;
  target: string;
};

type PreviewError = { line: number; field?: string; message: string };
type Preview = { count: number; rows: PreviewRow[]; errors: PreviewError[] };

function errorMessage(error: unknown) {
  const data = (error as { response?: { data?: { error?: string; message?: string; errors?: PreviewError[] } } })?.response?.data;
  if (data?.errors?.length) return data.errors.map((item) => `第 ${item.line} 行${item.field ? `（${item.field}）` : ""}：${item.message}`).join("；");
  return data?.error || data?.message || (error as Error)?.message || "匯入失敗，請稍後再試。";
}

export default function QualificationAssignmentImport({ competitionId }: { competitionId: number }) {
  const queryClient = useQueryClient();
  const submitLockRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Preview>();
  const [success, setSuccess] = useState("");

  const invalidatePreview = () => {
    setPreview(undefined);
    setSuccess("");
    resetPreview();
    resetImport();
  };
  const previewRequest = (content: string) => qualificationAssignmentsApi.post<Preview>(`competition/${competitionId}/qualification-assignments/preview`, { csv: content });
  const importRequest = () => qualificationAssignmentsApi.post<{ assigned_count: number }>(`competition/${competitionId}/qualification-assignments`, { csv });
  const { mutate: requestPreview, isLoading: isPreviewing, error: previewError, reset: resetPreview } = useMutation(previewRequest, {
    onSuccess: (response) => { setPreview(response.data); },
  });
  const { mutate: submitImport, isLoading: isSubmitting, error: submitError, reset: resetImport } = useMutation(importRequest, {
    onSuccess: (response) => {
      queryClient.invalidateQueries(["competitionGroupsPlayersDetail", competitionId]);
      queryClient.invalidateQueries(["qualificationLanes"]);
      setSuccess(`已指派 ${response.data.assigned_count} 位選手。`);
      setPreview(undefined);
      setCsv("");
    },
    onError: () => { setPreview(undefined); },
    onSettled: () => { submitLockRef.current = false; },
  });
  const isBusy = isPreviewing || isSubmitting;
  const hasErrors = Boolean(preview?.errors?.length);

  return <>
    <Button onClick={() => setOpen(true)} variant="contained">貼上 CSV 指派</Button>
    <Dialog open={open} onClose={() => !isBusy && setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>資格賽 CSV 指派</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>欄位：player_name,group_name,position；例如：王小明,公開男子反曲弓組,1A。</Typography>
        <TextField
          label="貼上 CSV 內容"
          multiline
          minRows={6}
          maxRows={12}
          fullWidth
          value={csv}
          disabled={isBusy}
          placeholder={"player_name,group_name,position\n王小明,公開男子反曲弓組,1A"}
          onChange={(event) => {
            invalidatePreview();
            setCsv(event.target.value);
          }}
        />
        {Boolean(previewError) && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage(previewError)}</Alert>}
        {Boolean(submitError) && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage(submitError)}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        {preview && <Box sx={{ mt: 2 }} aria-live="polite">
          <Typography component="h2">預覽：{preview.count} 位</Typography>
          {hasErrors && <Alert severity="error">請修正下列資料後重新預覽。</Alert>}
          {preview.errors.map((item, index) => <Typography key={`${item.line}-${item.field}-${index}`}>第 {item.line} 行{item.field ? `（${item.field}）` : ""}：{item.message}</Typography>)}
          {preview.rows.map((row) => <Typography key={row.line}>第 {row.line} 行：{row.player_name}／{row.group_name}／{row.position}</Typography>)}
        </Box>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => requestPreview(csv)} disabled={!csv.trim() || isBusy}>{isPreviewing ? "預覽中…" : "預覽"}</Button>
        <Button
          onClick={() => {
            if (submitLockRef.current || !preview || hasErrors) return;
            submitLockRef.current = true;
            submitImport();
          }}
          disabled={!preview || hasErrors || isBusy}
        >{isSubmitting ? "匯入中…" : "確認匯入"}</Button>
        <Button onClick={() => setOpen(false)} disabled={isBusy}>關閉</Button>
      </DialogActions>
    </Dialog>
  </>;
}
