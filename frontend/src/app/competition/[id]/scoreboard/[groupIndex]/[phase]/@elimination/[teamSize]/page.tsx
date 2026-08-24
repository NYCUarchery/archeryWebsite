"use client";
import EliminationTreeChart from "@/components/EliminationTreeChart";
import { parseStagesToTree } from "@/utils/parseStagesToTree";
import useGetElimination from "@/utils/QueryHooks/useGetElimination";
import useGetEliminationDetail from "@/utils/QueryHooks/useGetEliminationDetail";
import { Box, Typography } from "@mui/material";
import { isCompleteEliminationBracket } from "@/utils/eliminationBracket";

export default function Page({
  params,
}: {
  params: { id: string; groupIndex: string; teamSize: string };
}) {
  const windowWidth = typeof window === "undefined" ? 0 : window.innerWidth;
  const teamSize = parseInt(params.teamSize);
  const competitionId = parseInt(params.id);
  const groupIndex = parseInt(params.groupIndex);

  const { data: elimination } = useGetElimination(
    competitionId,
    groupIndex,
    teamSize
  );

  const { data: eliminationDetail } = useGetEliminationDetail(
    elimination?.elimination_id
  );

  if (!elimination || !eliminationDetail)
    return <Typography>Loading...</Typography>;

  const stages = eliminationDetail.stages ?? [];
  if (!isCompleteEliminationBracket(stages)) {
    return <Typography>尚未建立完整對抗樹。</Typography>;
  }

  const { goldRoot, silverRoot, bronzeRoot } = parseStagesToTree(stages);

  const advancingNum = stages[0].matchs!.length * 2;

  const expectStageNum = Math.ceil(Math.log2(advancingNum)) + 1;
  const chartWidth = expectStageNum * 200;

  return (
    <Box
      sx={{
        overflow: "auto",
        display: windowWidth > chartWidth ? "flex" : "block",
        justifyContent: "center",
      }}
    >
      <Box>
        <EliminationTreeChart
          goldRoot={goldRoot}
          silverRoot={silverRoot}
          bronzeRoot={bronzeRoot}
          playerSets={eliminationDetail.player_sets ?? []}
          height={stages[0].matchs!.length * 100}
          width={chartWidth}
        />
      </Box>
    </Box>
  );
}
