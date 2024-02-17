import { Grid, Divider } from "@mui/material";
interface Props {
  totalTens: number;
  totalXs: number;
  totalScore: number;
}

export default function StatisticRow({
  totalTens,
  totalXs,
  totalScore,
}: Props) {
  return (
    <Grid
      container
      columns={6}
      sx={{
        height: "40px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "nowrap",
      }}
    >
      <Grid
        item
        xs={1}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        X
      </Grid>
      <Divider variant="middle" orientation="vertical" flexItem />
      <Grid
        item
        xs={1}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        {totalXs}
      </Grid>
      <Divider orientation="vertical" flexItem />
      <Grid
        item
        xs={1}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        X+10
      </Grid>
      <Divider orientation="vertical" flexItem variant="middle" />
      <Grid
        item
        xs={1}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        {totalTens + totalXs}
      </Grid>
      <Divider orientation="vertical" flexItem />
      <Grid
        item
        xs={1}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        Total
      </Grid>
      <Divider orientation="vertical" flexItem variant="middle" />
      <Grid
        item
        xs={1}
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        {totalScore}
      </Grid>
    </Grid>
  );
}
