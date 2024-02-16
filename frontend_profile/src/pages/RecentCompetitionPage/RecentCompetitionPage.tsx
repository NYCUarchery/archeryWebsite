import { useEffect, useState } from "react";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
// import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Typography from "@mui/material/Typography";

import ToCreateButton from "./components/ToCreateButton";
import useGetCompetitions from "../../util/QueryHooks/useGetCompetitions";
import useGetUid from "../../util/QueryHooks/useGetUid";
import Pagination from "@mui/material/Pagination";
import { CompetitionList } from "./components/CompetitionList";

export default function RecentCompetitionPage() {
  const [page, setPage] = useState(1);
  const [startIndex, setStartIndex] = useState((page - 1) * 5);
  const [endIndex, setEndIndex] = useState(page * 5 - 1);

  const { data: competitions, isLoading: isLoadingCompetitions } =
    useGetCompetitions(startIndex, endIndex);
  const { data: uid, isLoading: isLoadingUid } = useGetUid();
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    setStartIndex((value - 1) * 5);
    setEndIndex(value * 5 - 1);
  };

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <CardContent>
        <Grid container justifyContent="center">
          <Grid item>
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
        {isLoadingCompetitions || isLoadingUid || !uid ? (
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
