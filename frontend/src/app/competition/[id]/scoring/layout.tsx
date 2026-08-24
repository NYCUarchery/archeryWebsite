"use client";

import { Box } from "@mui/material";
import useGetCompetitionProgress from "@/utils/QueryHooks/useGetCompetitionProgress";

// 依 competition.current_phase 分流：0 → 資格賽 slot；1/2/3 → 對抗賽 slot。
// 其餘（載入中／取不到資料／未知 phase）一律顯示明確中文提示，不得回空內容。
export default function Layout({
  qualification,
  elimination,
  params,
}: {
  qualification: React.ReactNode;
  elimination: React.ReactNode;
  params: { id: string };
}) {
  const competitionId = parseInt(params.id);
  const {
    data: competition,
    isLoading,
    isError,
  } = useGetCompetitionProgress(competitionId);

  let content: React.ReactNode;
  if (isLoading) {
    content = <p>載入賽事資料中...</p>;
  } else if (isError || !competition) {
    content = <p>找不到賽事資料，請稍後再試。</p>;
  } else if (competition.current_phase === 0) {
    content = qualification;
  } else if (
    competition.current_phase === 1 ||
    competition.current_phase === 2 ||
    competition.current_phase === 3
  ) {
    content = elimination;
  } else {
    content = <p>目前賽事階段尚未設定，無法顯示記分頁面。</p>;
  }

  return (
    <Box className="recording_board" sx={{ maxWidth: "400px" }}>
      {content}
    </Box>
  );
}
