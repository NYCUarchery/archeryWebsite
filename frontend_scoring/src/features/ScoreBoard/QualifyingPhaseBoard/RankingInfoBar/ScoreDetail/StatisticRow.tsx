import { Grid, Divider } from "@mui/material";
interface Props {
  _10Num: number;
  xNum: number;
  totalScore: number;
}

export default function StatisticRow({ _10Num, xNum, totalScore }: Props) {
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
        {xNum}
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
        {xNum + _10Num}
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
