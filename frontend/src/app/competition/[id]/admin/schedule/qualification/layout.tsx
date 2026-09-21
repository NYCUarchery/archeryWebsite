"use Client";
import { Card } from "@mui/material";
import Grid from "@mui/material/Grid2";
import React from "react";
export default function Layout({
  settings,
  lane_panel,
}: {
  settings: React.ReactNode;
  lane_panel: React.ReactNode;
}) {
  return (
    <Grid
      container
      spacing={{ xs: 2, md: 4 }}
      sx={{ width: "100%", p: { xs: 2, sm: 3, md: "20px 50px" } }}
    >
      <Grid size={{ xs: 12, md: 3 }} sx={{ minWidth: 0 }}>
        <Card sx={{ p: { xs: 2, sm: 3 } }}>{settings}</Card>
      </Grid>
      <Grid size={{ xs: 12, md: 9 }} sx={{ minWidth: 0 }}>
        <Card sx={{ p: 2, minWidth: 0, overflowX: "auto" }}>{lane_panel}</Card>
      </Grid>
    </Grid>
  );
}
