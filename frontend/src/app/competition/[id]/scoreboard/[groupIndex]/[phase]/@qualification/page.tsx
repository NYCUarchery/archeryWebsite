"use client";
import { RankingInfoBar } from "@/components/RankingInfoBar";
import Grid from "@mui/material/Grid2";
import { apiClient } from "@/utils/ApiClient";
import { useQuery, useQueryClient } from "react-query";
import { Qualification } from "@/types/oldRef/Qualification";
import { DatabaseGroup } from "@/types/Api";
import { Box } from "@mui/material";

export default function Page({
  params,
}: {
  params: { id: string; groupIndex: string };
}) {
  const queryClient = useQueryClient();
  const competition: any = queryClient.getQueryData([
    "competitionWithGroups",
    params.id,
  ]);
  const groupShown: number = parseInt(params.groupIndex);
  const group = competition.data.groups!.find(
    (g: DatabaseGroup) => g.group_index === groupShown
  ) as DatabaseGroup;

  const { data: qualification } = useQuery(
    ["qualification", group?.id ?? -1],
    () =>
      apiClient.qualification.qualificationLanesPlayersDetail(group?.id ?? -1),
    { select: (data) => data.data as unknown as Qualification }
  );

  const advancingNum = qualification?.advancing_num ?? 0;
  const playersWithLaneNumber: any = [];
  const RankingInfoBars = [];

  console.dir(qualification);

  qualification?.lanes.forEach((lane) => {
    lane.players.forEach((player) => {
      playersWithLaneNumber.push({ ...player, laneNumber: lane.lane_number });
    });
  });

  playersWithLaneNumber.sort((a: any, b: any) => a.rank - b.rank);
  for (let i = 0; i < playersWithLaneNumber.length; i++) {
    let isQudalified: boolean;
    i < advancingNum ? (isQudalified = true) : (isQudalified = false);

    RankingInfoBars.push(
      <RankingInfoBar
        key={i}
        player={playersWithLaneNumber[i]}
        laneNumber={playersWithLaneNumber[i].laneNumber}
        isQudalified={isQudalified}
      ></RankingInfoBar>
    );
  }

  return (
    <Box display={"flex"} justifyContent={"center"}>
      <Box
        className="qualification_board"
        sx={{
          width: "400px",
        }}
      >
        <ColumnTitle />
        {RankingInfoBars}
      </Box>
    </Box>
  );
}

function ColumnTitle() {
  return (
    <Grid
      container
      columns={90}
      className="scoreboard_row column_title"
      sx={{ alignItems: "center", textAlign: "center", height: "23px" }}
    >
      <Grid size={10}>排名</Grid>
      <Grid size={10}>靶號</Grid>
      <Grid size={20}>姓名</Grid>
      <Grid size={50}>分數</Grid>
    </Grid>
  );
}
