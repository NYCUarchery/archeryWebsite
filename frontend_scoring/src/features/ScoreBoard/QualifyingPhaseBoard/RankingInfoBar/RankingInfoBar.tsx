import { Player } from "../../../../QueryHooks/types/Player";
import { useState } from "react";
import useGetOnlyLane from "../../../../QueryHooks/useGetOnlyLane";
import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
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
  const [open, setOpen] = useState(false);

  const { data: lane } = useGetOnlyLane(playerShell.lane_id);
  const { data: player } = useGetPlayerWithScores(playerShell.id);
  if (!lane || !player) return <></>;
  const playerStats = calculatePlayerStats(player) as PlayerStats;
  const target = lane.lane_number + numberToAlphabet(playerShell.order);
  isQudalified ? (className += " qualified") : (className += " unqualified");

  const handleClose = () => {
    setOpen(false);
  };
  const handleClick = () => {
    setOpen(true);
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
      <Dialog
        open={open}
        keepMounted
        fullWidth={true}
        maxWidth="xs"
        onClose={handleClose}
      >
        <DialogTitle>
          排名{player.rank} {target} {player.name}
        </DialogTitle>
        <ScoreDetail playerStats={playerStats}></ScoreDetail>
      </Dialog>
    </>
  );
}
const numberToAlphabet = (num: number) => {
  num--;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[num];
};
