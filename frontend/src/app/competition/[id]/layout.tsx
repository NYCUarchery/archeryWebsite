"use client";
import GameTitleBar from "@/components/GameTitleBar/GameTitleBar";
import SubGamesBar from "@/components/SubGameBar/SubGamesBar";
import { Group } from "@/types/oldRef/Competition";
import useGetCompetitionWithGroups from "@/utils/QueryHooks/useGetCompetitionWithGroups";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";

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
    isLoading,
  } = useGetCompetitionWithGroups(competitionId);

  return (
    <>
      <GameTitleBar
        name={user?.real_name ?? "訪客"}
        title={competition?.title}
        subtitle={competition?.sub_title}
        isLoading={isLoading}
        isError={isError}
      />
      <SubGamesBar
        competition={competition}
        groups={competition?.groups as Group[]}
        isLoading={isLoading}
      />
      {isLoading ? <div>Loading...</div> : children}
    </>
  );
}
