"use client";
import { useState } from "react";

import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
// import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Typography from "@mui/material/Typography";

import ToCreateButton from "./ToCreateButton";
import Pagination from "@mui/material/Pagination";
import { CompetitionList } from "@/components/CompetitionList";
import { useQuery } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import { DatabaseCompetition } from "@/types/Api";
import { useGetUserId } from "@/utils/QueryHooks/useGetUserID";

export default function RecentCompetitionPage() {
  const [page, setPage] = useState(1);
  const [startIndex, setStartIndex] = useState((page - 1) * 5);
  const [endIndex, setEndIndex] = useState(page * 5 - 1);

  const { data: competitions, isLoading: isLoadingCompetitions } = useQuery(
    "competitions",
    () =>
      apiClient.competition.competitionCurrentDetail(
        startIndex.toString(),
        endIndex.toString(),
        {
          head: startIndex,
          tail: endIndex,
        }
      ),
    {
      retry: false,
      select: (data) => data.data as unknown as DatabaseCompetition[],
    }
  );
  const { data: uid, isLoading: isLoadingUid } = useGetUserId();
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    setStartIndex((value - 1) * 5);
    setEndIndex(value * 5 - 1);
  };

  return (
    <Card sx={{ p: 2, mb: 2, maxWidth: "600px" }}>
      <CardContent>
        <Grid container justifyContent="center">
          <Grid>
            <Typography variant="h5" component="div">
              近期比賽
            </Typography>
          </Grid>
        </Grid>
        <ToCreateButton />
        <Pagination
          count={10}
          color="primary"
          onChange={handlePageChange}
          page={page}
          sx={{ display: "flex", justifyContent: "center" }}
        />
        {competitions?.length === 0 && <h2>沒有更多比賽了喲 ;(</h2>}
        {isLoadingCompetitions || isLoadingUid || !uid || !competitions ? (
          <p>loading...</p>
        ) : (
          <CompetitionList competitions={competitions} uid={uid} />
        )}

        <Pagination
          count={10}
          color="primary"
          onChange={handlePageChange}
          page={page}
          sx={{ display: "flex", justifyContent: "center" }}
        />
      </CardContent>
    </Card>
  );
}
