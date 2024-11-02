"use client";
import { RankingInfoBar } from "@/components/RankingInfoBar";
import Grid from "@mui/material/Grid2";
import { apiClient } from "@/utils/ApiClient";
import { useQuery, useQueryClient } from "react-query";
import { Qualification } from "@/types/oldRef/Qualification";
import { DatabaseGroup } from "@/types/Api";
import { Box, Dialog, DialogTitle } from "@mui/material";
import { useState } from "react";
import { Player } from "@/types/oldRef/Player";
import { calculatePlayerStats } from "@/utils/calculatePlayerStatistics";
import ScoreDetail from "@/components/ScoreDetail/ScoreDetail";
import numberToAlphabet from "@/utils/numberToAlphabet";

export default function Page({
  params,
}: {
  params: { id: string; groupIndex: string };
}) {
  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const competitionId = parseInt(params.id);
  const queryClient = useQueryClient();
  const competition: any = queryClient.getQueryData([
    "competitionWithGroups",
    competitionId,
  ]);
  const groupShown: number = parseInt(params.groupIndex);
  const group = competition.data.groups!.find(
    (g: DatabaseGroup) => g.group_index === groupShown
  ) as DatabaseGroup;

  const { data: qualification } = useQuery(
    ["qualification", group?.id ?? -1],
    () => apiClient.qualification.lanesPlayersDetail(group?.id ?? -1),
    {
      select: (data) => data.data as unknown as Qualification,
      staleTime: Infinity,
    }
  );
  const { data: player } = useQuery(
    ["player", playerId],
    () => apiClient.player.scoresDetail(playerId ?? -1),
    {
      select: (data) => data.data as unknown as Player,
      enabled: playerId !== null,
    }
  );

  const advancingNum = qualification?.advancing_num ?? 0;
  const playersWithLaneNumber: any = [];
  const RankingInfoBars = [];

  qualification?.lanes.forEach((lane) => {
    lane.players.forEach((player) => {
      playersWithLaneNumber.push({ ...player, laneNumber: lane.lane_number });
    });
  });

  playersWithLaneNumber.sort((a: any, b: any) => a.rank - b.rank);
  for (let i = 0; i < playersWithLaneNumber.length; i++) {
    let isQudalified: boolean;
    i < advancingNum ? (isQudalified = true) : (isQudalified = false);
    const target =
      playersWithLaneNumber[i].laneNumber.toString() +
      numberToAlphabet(playersWithLaneNumber[i].order ?? 26);
    const handleClick = (e: any) => {
      e.stopPropagation();
      setOpen(true);
      setPlayerId(playersWithLaneNumber[i].id);
    };

    RankingInfoBars.push(
      <RankingInfoBar
        key={i}
        player={playersWithLaneNumber[i]}
        target={target}
        isQudalified={isQudalified}
        onClick={handleClick}
      ></RankingInfoBar>
    );
  }

  const handleClose = () => {
    setOpen(false);
    setPlayerId(null);
  };

  return (
    <>
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
      <Dialog
        open={open}
        keepMounted
        fullWidth={true}
        maxWidth="xs"
        onClose={handleClose}
      >
        {player ? (
          <>
            <DialogTitle>
              排名{player.rank} {player.name}
            </DialogTitle>
            <ScoreDetail
              playerStats={calculatePlayerStats(player!)!}
            ></ScoreDetail>
          </>
        ) : (
          <DialogTitle>載入中</DialogTitle>
        )}
      </Dialog>
    </>
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
