"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";
import { useMutation, useQuery } from "react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "@/utils/ApiClient";
import { useGetUserId } from "@/utils/QueryHooks/useGetUserID";
import type { EndpointBulkUserPreviewResponse } from "@/types/Api";


function errorMessage(error: unknown): string {
  if (typeof error !== "object" || error === null) return String(error || "請稍後再試。");
  const data = (error as { response?: { data?: { error?: string; message?: string; errors?: Array<{ line?: number; field?: string; message?: string }> } } }).response?.data;
  if (data?.errors?.length) {
    return data.errors.map((item) => `第 ${item.line || "?"} 行${item.field ? `（${item.field}）` : ""}：${item.message || "資料錯誤"}`).join("；");
  }
  return data?.error || data?.message || (error as Error).message || "請稍後再試。";
}

export default function BulkRegisterPage() {
  const router = useRouter();
  const { data: userId, isError: isUserIdError, isLoading: isLoadingUserId, isFetched: isUserIdFetched } = useGetUserId();
  const { data: user, isLoading: isLoadingUser, isError: isUserError, refetch: refetchUser } = useQuery(
    ["bulkRegisterCurrentUser", userId],
    () => apiClient.user.userDetail(userId!),
    {
      enabled: userId !== undefined,
      retry: false,
      staleTime: Infinity,
      select: (response) => response.data,
    },
  );
  const [competitionId, setCompetitionId] = useState("");
  const [prefix, setPrefix] = useState("");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<EndpointBulkUserPreviewResponse>();
  const [resultMessage, setResultMessage] = useState("");
  const submitLockRef = useRef(false);

  const isDictator = user?.role === "Dictator";
  const { data: competitions, isLoading: isLoadingCompetitions, isError: isCompetitionsError } = useQuery(
    ["bulkRegisterCompetitions"],
    () => apiClient.competition.competitionList(),
    {
      enabled: isDictator,
      staleTime: Infinity,
      select: (response) => response.data,
    },
  );

  useEffect(() => {
    if (isUserIdError || (isUserIdFetched && userId === undefined)) router.replace("/login?next=/bulk_register");
  }, [isUserIdError, isUserIdFetched, router, userId]);

  useEffect(() => {
    if (user && !isDictator) router.replace("/");
  }, [isDictator, router, user]);

  const invalidatePreview = () => {
    setPreview(undefined);
    setResultMessage("");
  };

  const { mutate: requestPreview, isLoading: isPreviewing, error: previewError } = useMutation(
    apiClient.user.bulkPreview,
    {
      onSuccess: (response) => setPreview(response.data),
    },
  );
  const { mutate: submitBulk, isLoading: isSubmitting, error: submitError } = useMutation(apiClient.user.bulkCreate, {
    onSuccess: (response) => {
      setResultMessage(`已建立 ${response.data.created_count} 位選手。`);
      setCsv("");
      setPreview(undefined);
    },
    onSettled: () => {
      submitLockRef.current = false;
    },
  });

  const request = () => ({
    competition_id: Number(competitionId),
    prefix,
    csv,
  });
  const hasPreviewErrors = Boolean(preview?.errors?.length);
  const isBusy = isPreviewing || isSubmitting;

  if (isUserIdError || (isUserIdFetched && userId === undefined) || (user && !isDictator)) return null;
  if (isLoadingUserId || (userId !== undefined && isLoadingUser) || !isUserIdFetched) {
    return <Box className="home-status" role="status"><CircularProgress aria-label="確認管理員權限" /></Box>;
  }
  if (isUserError) {
    return <Box className="home-section"><Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetchUser()}>重新嘗試</Button>}>無法確認管理員權限。</Alert></Box>;
  }
  if (!user) return <Box className="home-status" role="status"><CircularProgress aria-label="確認管理員權限" /></Box>;

  return (
    <Box component="section" className="home-section bulk-register-page" aria-labelledby="page-title">
      <Box className="home-section-head">
        <Box>
          <Typography component="h1" id="page-title">管理員批次註冊</Typography>
          <Typography className="home-section-subtitle">貼上 CSV，預覽後建立帳號並直接加入賽事。</Typography>
        </Box>
      </Box>
      <Box component="form" className="bulk-register-form" onSubmit={(event) => {
        event.preventDefault();
        if (!competitionId || !csv || isBusy) return;
        requestPreview(request());
      }}>
        <TextField
          select
          required
          label="賽事"
          value={competitionId}
          onChange={(event) => { setCompetitionId(event.target.value); invalidatePreview(); }}
          disabled={isBusy || isLoadingCompetitions}
          fullWidth
        >
          <MenuItem value="" disabled>選擇賽事</MenuItem>
          {competitions?.map((competition) => (
            <MenuItem key={competition.id} value={competition.id}>{competition.title || `賽事 ${competition.id}`}</MenuItem>
          ))}
        </TextField>
        {isCompetitionsError && <Alert severity="error">無法載入賽事。</Alert>}
        <TextField
          label="帳號前綴"
          value={prefix}
          onChange={(event) => { setPrefix(event.target.value); invalidatePreview(); }}
          disabled={isBusy}
          helperText="可留白；最終帳號為此前綴加上 CSV 的 user_name。"
          fullWidth
        />
        <TextField
          required
          label="CSV"
          value={csv}
          onChange={(event) => { setCsv(event.target.value); invalidatePreview(); }}
          disabled={isBusy}
          placeholder="user_name,real_name,password\n001,王小明,password123"
          helperText="必填：user_name（帳號片段）、real_name（真名）、password（密碼）。選填：email（電子郵件）、institution_id（組織／學校 ID；未填為 No Institution）、overview（自我介紹）。選填欄可省略；列入標題時，每列須保留對應空欄。上限 100 筆、1 MiB。"
          multiline
          minRows={10}
          fullWidth
          inputProps={{ "aria-label": "CSV" }}
        />
        <Box className="bulk-register-actions">
          <Button className="home-button-secondary" type="submit" disabled={!competitionId || !csv || isBusy}>
            {isPreviewing ? "預覽中…" : "預覽"}
          </Button>
          <Button
            className="home-button-primary"
            type="button"
            disabled={!preview || hasPreviewErrors || isBusy}
            onClick={() => {
              if (submitLockRef.current || !preview || hasPreviewErrors) return;
              submitLockRef.current = true;
              submitBulk(request());
            }}
          >
            {isSubmitting ? "建立中…" : "確認建立"}
          </Button>
        </Box>
      </Box>

      {Boolean(previewError) && <Alert severity="error" className="bulk-register-alert">{errorMessage(previewError)}</Alert>}
      {Boolean(submitError) && <Alert severity="error" className="bulk-register-alert">{errorMessage(submitError)}</Alert>}
      {resultMessage && <Alert severity="success" className="bulk-register-alert">{resultMessage}</Alert>}
      {preview && (
        <Box className="bulk-register-preview" aria-live="polite">
          <Typography component="h2">預覽：{preview.count} 位</Typography>
          {hasPreviewErrors && (
            <Alert severity="error">請修正下列資料後重新預覽。</Alert>
          )}
          {preview.errors?.map((item, index) => (
            <Typography key={`${item.line}-${item.field}-${index}`} className="bulk-register-error">
              第 {item.line} 行{item.field ? `（${item.field}）` : ""}：{item.message}
            </Typography>
          ))}
          {!hasPreviewErrors && preview.rows?.length === 0 && <Alert severity="warning">CSV 未包含可建立資料。</Alert>}
          {preview.rows?.length ? (
            <Box component="ul" className="bulk-register-rows">
              {preview.rows.map((row) => <li key={row.line}>第 {row.line} 行：{row.user_name}／{row.real_name}</li>)}
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  );
}
