import Grid from "@mui/material/Grid2";

import { DatabasePlayer } from "@/types/Api";
export interface Props {
  player: DatabasePlayer;
  laneNumber: number;
  isQudalified: boolean;
}

export function RankingInfoBar({ player, laneNumber, isQudalified }: Props) {
  let className: string = "scoreboard_row ranking_info_bar";

  const target = laneNumber + numberToAlphabet(player.order as number);
  isQudalified ? (className += " qualified") : (className += " unqualified");

  return (
    <>
      <Grid
        container
        columns={90}
        className={className}
        sx={{ alignItems: "center", textAlign: "center", height: "23px" }}
      >
        <Grid size={10}>{player.rank}</Grid>
        <Grid size={10}>{target}</Grid>
        <Grid size={20}>{player.name}</Grid>
        <Grid size={50}>{player.total_score}</Grid>
      </Grid>
      {/* <Dialog
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
      </Dialog> */}
    </>
  );
}
const numberToAlphabet = (num: number) => {
  num--;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[num];
};
