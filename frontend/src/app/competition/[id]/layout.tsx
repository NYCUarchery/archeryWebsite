"use client";
import GameTitleBar from "@/components/GameTitleBar/GameTitleBar";
import SubGamesBar from "@/components/SubGameBar/SubGamesBar";
import { Group } from "@/types/oldRef/Competition";
import { Participant } from "@/types/oldRef/Participant";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import useGetCurrentParticipentDetail from "@/utils/QueryHooks/useGetCurrentParticipentDetail";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";
import useGetPlayersByParticipant from "@/utils/QueryHooks/useGetPlayersByParticipant";

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const { data: user } = useGetCurrentUserDetail();
  const competitionId = parseInt(params.id);
  const {
    data: competition,
    isError,
    isLoading: isLoadingCompetition,
  } = useGetCompetitionWithGroups(competitionId);
  const { data: participant, isLoading: isLoadingParticipant } =
    useGetCurrentParticipentDetail(user?.id);

  const { data: players, isLoading: isLoadingPlayer } =
    useGetPlayersByParticipant((participant as Participant)?.id, competitionId);

  const isLoading =
    isLoadingCompetition || isLoadingParticipant || isLoadingPlayer;

  if (isLoading) return <span>Loading...</span>;

  return (
    <>
      <GameTitleBar
        name={user?.real_name ?? "訪客"}
        title={competition?.title}
        subtitle={competition?.sub_title}
        isLoading={isLoading}
        isError={isError}
        participant={participant as Participant | undefined}
      />
      <SubGamesBar
        competition={competition}
        groups={competition?.groups as Group[]}
        isLoading={isLoading}
        player={players?.[0]}
      />
      {children}
    </>
  );
}
