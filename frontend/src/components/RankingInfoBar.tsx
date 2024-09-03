import Grid from "@mui/material/Grid2";

import { DatabasePlayer } from "@/types/Api";
export interface Props {
  player: DatabasePlayer;
  target: string;
  isQudalified: boolean;
  onClick?: (e: any) => void;
}

export function RankingInfoBar({
  player,
  target,
  isQudalified,
  onClick,
}: Props) {
  let className = "scoreboard_row ranking_info_bar";

  isQudalified ? (className += " qualified") : (className += " unqualified");

  return (
    <>
      <Grid
        container
        columns={90}
        className={className}
        sx={{
          alignItems: "center",
          textAlign: "center",
          minHeight: "23px",
          cursor: "pointer",
        }}
        onClick={onClick}
      >
        <Grid size={10}>{player.rank}</Grid>
        <Grid size={10}>{target}</Grid>
        <Grid size={20}>{player.name}</Grid>
        <Grid size={50}>{player.total_score}</Grid>
      </Grid>
    </>
  );
}
