"use client";
import Grid from "@mui/material/Grid2";
import LaneBlock from "./LaneBlock";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import { Competition } from "@/types/oldRef/Competition";

import useGetLanes from "@/utils/QueryHooks/useGetLanes";

export default function Page({ params }: { params: { id: string } }) {
  const competitionId = parseInt(params.id);
  const { data: lanes } = useGetLanes(competitionId);
  const competition = useGetCompetitionWithGroups(competitionId)
    .data as Competition;

  return (
    <Grid container spacing={2}>
      {lanes?.map((lane, index) => {
        if (index === 0) return null;
        return (
          <Grid size={3} key={index}>
            <LaneBlock
              laneId={lane.id}
              laneNumber={lane.lane_number}
              currentEndIndex={competition.qualification_current_end}
            />
          </Grid>
        );
      }) ?? null}
    </Grid>
  );
}
