import { Player } from "../../../../QueryHooks/types/Player";
import { useState } from "react";
import useGetOnlyLane from "../../../../QueryHooks/useGetOnlyLane";
import { Grid, Popover } from "@mui/material";
import ScoreDetail from "./ScoreDetail/ScoreDetail";
export interface Props {
  player: Player;
  isQudalified: boolean;
}

export function RankingInfoBar({ player, isQudalified }: Props) {
  let className: string = "scoreboard_row ranking_info_bar";
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const open = Boolean(anchorEl);
  const { data: lane } = useGetOnlyLane(player.lane_id);
  if (!lane) return <></>;
  isQudalified ? (className += " qualified") : (className += " unqualified");
  const target = lane.lane_number + numberToAlphabet(player.order);
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
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
          {player.total_score}
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
        <ScoreDetail playerShell={player}></ScoreDetail>
      </Popover>
    </>
  );
}
const numberToAlphabet = (num: number) => {
  num--;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[num];
};
