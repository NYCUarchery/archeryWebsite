import useGetOnlyLane from "../../../../QueryHooks/useGetOnlyLane";
import { RankingProps } from "../QualificationBoard";
import { Grid } from "@mui/material";

export function RankingInfoBar(rankingProps: RankingProps) {
  let className: string = "scoreboard_row ranking_info_bar";
  const player = rankingProps.player;
  const { data: lane } = useGetOnlyLane(player.lane_id);
  if (!lane) return <></>;
  rankingProps.isQudalified
    ? (className += " qualified")
    : (className += " unqualified");
  const target = lane.lane_number + numberToAlphabet(player.order);
  return (
    <Grid
      container
      columns={90}
      className={className}
      sx={{ alignItems: "center", height: "23px" }}
    >
      <Grid item xs={10}>
        {rankingProps.player.rank}
      </Grid>
      <Grid item xs={10}>
        {target}
      </Grid>
      <Grid item xs={20}>
        {rankingProps.player.name}
      </Grid>
      <Grid item xs={50}>
        {rankingProps.player.total_score}
      </Grid>
    </Grid>
  );
}
const numberToAlphabet = (num: number) => {
  num--;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[num];
};
