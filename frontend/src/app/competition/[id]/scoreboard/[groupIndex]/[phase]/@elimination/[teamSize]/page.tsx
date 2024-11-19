"use client";
import EliminationTreeChart from "@/components/EliminationTreeChart";
import { parseStagesToTree } from "@/utils/parseStagesToTree";
import useGetElimination from "@/utils/QueryHooks/useGetElimination";
import useGetEliminationDetail from "@/utils/QueryHooks/useGetEliminationDetail";
import { Box, Typography } from "@mui/material";

export default function Page({
  params,
}: {
  params: { id: string; groupIndex: string; teamSize: string };
}) {
  const windowWidth = window?.innerWidth ?? 0;
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

  const { goldRoot, silverRoot, bronzeRoot } = parseStagesToTree(
    eliminationDetail.stages!
  );

  const advancingNum = eliminationDetail.stages![0].matchs!.length * 2;

  const expectStageNum = Math.ceil(Math.log2(advancingNum)) + 1;
  console.log("expectStageNum", expectStageNum);
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
          playerSets={eliminationDetail.player_sets!}
          height={eliminationDetail.stages![0].matchs!.length * 100}
          width={chartWidth}
        />
      </Box>
    </Box>
  );
}
