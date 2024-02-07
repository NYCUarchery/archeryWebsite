import { useEffect, useState } from "react";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
// import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { Competition } from "./CompetitionPageComponents/Competition";
import ToCreateButton from "./CompetitionPageComponents/ToCreateButton";
import useGetCompetitions from "../../util/QueryHooks/useGetCompetitions";
import useGetUid from "../../util/QueryHooks/useGetUid";

// The updated ContestPage component
const ContestPage = () => {
  const { data: competitions, isLoading: isLoadingCompetitions } =
    useGetCompetitions(0, 5);
  const { data: uid, isLoading: isLoadingUid } = useGetUid();

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <CardContent>
        <Box sx={{ mb: 4 }}>
          <Grid container justifyContent="center">
            <Grid item>
              <Typography variant="h5" component="div">
                近期比賽
              </Typography>
            </Grid>
          </Grid>
          <ToCreateButton />
          {isLoadingCompetitions || isLoadingUid ? (
            <p>loading...</p>
          ) : (
            competitions?.map((competition: any) => (
              <Competition
                competition={competition}
                uid={uid}
                key={competition.id}
              />
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ContestPage;
