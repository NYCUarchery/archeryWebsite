"use client";

import PanelMenu from "@/components/GameTitleBar/PanelMenu";
import { Participant } from "@/types/oldRef/Participant";
import useGetCurrentParticipentDetail from "@/utils/QueryHooks/useGetCurrentParticipentDetail";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function JudgeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const competitionId = Number(params.id);
  const router = useRouter();
  const { data: user, isLoading: isUserLoading } = useGetCurrentUserDetail();
  const { data: participant, isLoading: isParticipantLoading } =
    useGetCurrentParticipentDetail(competitionId, user?.id);
  const currentParticipant = participant as Participant | undefined;
  const canJudge =
    currentParticipant?.status === "approved" &&
    (currentParticipant.role === "Judge" || currentParticipant.role === "Admin");

  useEffect(() => {
    if (!isUserLoading && !isParticipantLoading && !canJudge) {
      router.replace(`/competition/${competitionId}/scoreboard`);
    }
  }, [canJudge, competitionId, isParticipantLoading, isUserLoading, router]);

  if (isUserLoading || isParticipantLoading) {
    return (
      <Box sx={{ display: "grid", minHeight: "100dvh", placeItems: "center" }}>
        <CircularProgress aria-label="載入裁判頁" />
      </Box>
    );
  }
  if (!canJudge) {
    return <Typography sx={{ p: 2 }}>您沒有裁判記分權限。</Typography>;
  }

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <Box
        component="nav"
        aria-label="裁判頁面切換"
        sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}
      >
        <PanelMenu panelName="judge" participant={currentParticipant} />
      </Box>
      {children}
    </Box>
  );
}
