"use client";
import { Box } from "@mui/material";
import { apiClient } from "@/utils/ApiClient";
import { useQuery } from "react-query";
import { Group } from "@/types/oldRef/Competition";
import GroupCreator from "./GroupCreator";
import GroupGrid from "./GroudGrid";

export default function Page({ params }: { params: { id: string } }) {
  const competitionId = parseInt(params.id);
  const { data: groups } = useQuery(
    ["competitionGroupsPlayersDetail", competitionId],
    () => apiClient.competition.competitionGroupsPlayersDetail(competitionId),
    {
      select: (data) => data.data.groups as unknown as Group[],
      staleTime: Infinity,
    }
  );
  let grids: React.ReactNode = groups
    ? groups.map((_, index) => (
        <GroupGrid
          key={index}
          competitionId={competitionId}
          groups={groups!}
          groupIndex={index}
        />
      ))
    : null;

  console.log("page");
  return (
    <>
      <Box>
        <GroupCreator competitionId={competitionId} />
        <Box sx={{ display: "flex" }}>{grids}</Box>
      </Box>
    </>
  );
}
