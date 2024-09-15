"use client";

import { Competition } from "@/types/oldRef/Competition";

import EndPanel from "./EndPanel";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";

export default function Page({ params }: { params: { id: string } }) {
  const competitionId = parseInt(params.id);
  const competition = useGetCompetitionWithGroups(competitionId)
    .data as Competition;

  return (
    <EndPanel
      currentEndIndex={competition.qualification_current_end}
      roundNum={competition.rounds_num}
      competitionId={competitionId}
    />
  );
}
