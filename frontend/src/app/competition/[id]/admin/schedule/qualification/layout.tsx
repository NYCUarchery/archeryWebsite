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
    <Grid container spacing={4} sx={{ width: "100%", padding: "20px 50px" }}>
      <Grid size={3}>
        <Card sx={{ padding: "20px 50px" }}>{settings}</Card>
      </Grid>
      <Grid size={9}>
        <Card sx={{ padding: "20px" }}>{lane_panel}</Card>
      </Grid>
    </Grid>
  );
}
