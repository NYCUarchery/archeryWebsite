import { Player } from "../../../../QueryHooks/types/Player";
import { useState } from "react";
import useGetOnlyLane from "../../../../QueryHooks/useGetOnlyLane";
import { Grid, Popover } from "@mui/material";
import ScoreDetail from "./ScoreDetail/ScoreDetail";
import useGetPlayerWithScores from "../../../../QueryHooks/useGetPlayerWithScores";
import {
  calculatePlayerStats,
  PlayerStats,
} from "../../../../util/calculatePlayerStatistics";
export interface Props {
  playerShell: Player;
  isQudalified: boolean;
}

export function RankingInfoBar({ playerShell, isQudalified }: Props) {
  let className: string = "scoreboard_row ranking_info_bar";
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const open = Boolean(anchorEl);
  const { data: lane } = useGetOnlyLane(playerShell.lane_id);
  const { data: player } = useGetPlayerWithScores(playerShell.id);
  if (!lane || !player) return <></>;
  const playerStats = calculatePlayerStats(player) as PlayerStats;
  const target = lane.lane_number + numberToAlphabet(playerShell.order);
  isQudalified ? (className += " qualified") : (className += " unqualified");

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };
  return (
    <>
      <Grid
        container
        columns={90}
        className={className}
        sx={{ alignItems: "center", height: "23px" }}
        onClick={handleClick}
      >
        <Grid item xs={10}>
          {player.rank}
        </Grid>
        <Grid item xs={10}>
          {target}
        </Grid>
        <Grid item xs={20}>
          {player.name}
        </Grid>
        <Grid item xs={50}>
          {playerStats.totalScore}
        </Grid>
      </Grid>
      <Popover
        open={open}
        anchorEl={anchorEl}
        keepMounted
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <ScoreDetail playerStats={playerStats}></ScoreDetail>
      </Popover>
    </>
  );
}
const numberToAlphabet = (num: number) => {
  num--;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[num];
};
