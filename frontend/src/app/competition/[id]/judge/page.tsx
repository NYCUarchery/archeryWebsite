"use client";

import useGetCompetitionProgress from "@/utils/QueryHooks/useGetCompetitionProgress";
import { Alert, Box, CircularProgress } from "@mui/material";
import QualificationScoreEditor from "@/components/QualificationScoreEditor";
import JudgeEliminationBoard from "./JudgeEliminationBoard";

export default function JudgePage({ params }: { params: { id: string } }) {
  const competitionId = Number(params.id);
  const { data: competition, isLoading, isError } = useGetCompetitionProgress(competitionId);
  if (isLoading) return <Box sx={{ display: "grid", placeItems: "center", minHeight: "70dvh" }}><CircularProgress /></Box>;
  if (isError || !competition) return <Alert severity="error">無法讀取賽事目前階段。</Alert>;
  if (competition.current_phase === 0) return <QualificationScoreEditor competitionId={competitionId} />;
  if ([1, 2, 3].includes(competition.current_phase ?? -1)) return <JudgeEliminationBoard competitionId={competitionId} />;
  return <Alert severity="info">目前賽事尚未設定可裁判的階段。</Alert>;
}
