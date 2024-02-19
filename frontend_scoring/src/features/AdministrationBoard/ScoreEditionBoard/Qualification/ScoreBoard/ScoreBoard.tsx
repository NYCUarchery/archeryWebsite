import { Card, Grid } from "@mui/material";

import useGetPlayerWithScores from "../../../../../QueryHooks/useGetPlayerWithScores";

interface Props {
  selectedPlayerId: number;
}

export default function ScoreBoard({ selectedPlayerId }: Props) {
  const { data: player } = useGetPlayerWithScores(selectedPlayerId);
  let titleContent = "";

  if (selectedPlayerId === 0) titleContent = "請選擇選手";
  else if (!player) titleContent = "載入中";
  else titleContent = player.name;

  return (
    <Card sx={{ p: 4 }}>
      <Grid container>
        <Grid item xs={12}>
          <Card sx={{ p: 2, caretColor: "transparent" }}>{titleContent}</Card>
        </Grid>
      </Grid>
    </Card>
  );
}
