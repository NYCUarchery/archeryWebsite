"use Client";
import { Card } from "@mui/material";
import Grid from "@mui/material/Grid2";
import React from "react";
export default function Layout({
  controller,
  sets_panel,
}: {
  controller: React.ReactNode;
  sets_panel: React.ReactNode;
}) {
  return (
    <Grid container spacing={4} sx={{ width: "100%", padding: "20px 50px" }}>
      <Grid size={3}>
        <Card sx={{ padding: "20px 50px" }}>{controller}</Card>
      </Grid>
      <Grid size={9}>
        <Card sx={{ padding: "20px" }}>{sets_panel}</Card>
      </Grid>
    </Grid>
  );
}
