"use Client";
import { Card } from "@mui/material";
import Grid from "@mui/material/Grid2";
import React from "react";
export default function Layout({
  controll,
  lane_panel,
}: {
  controll: React.ReactNode;
  lane_panel: React.ReactNode;
}) {
  return (
    <Grid container spacing={4} sx={{ width: "100%", padding: "20px 50px" }}>
      <Grid size={3}>
        <Card sx={{ padding: "20px 20px" }}>{controll}</Card>
      </Grid>
      <Grid size={9}>{lane_panel}</Grid>
    </Grid>
  );
}
