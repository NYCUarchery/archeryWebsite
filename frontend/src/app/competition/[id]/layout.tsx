"use client";
import GameTitleBar from "@/components/GameTitleBar/GameTitleBar";
import SubGamesBar from "@/components/SubGameBar/SubGamesBar";
import { Competition, Group } from "@/types/oldRef/Competition";
import { apiClient } from "@/utils/ApiClient";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";
import { useQuery } from "react-query";

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const { data: user } = useGetCurrentUserDetail();
  const {
    data: competition,
    isError,
    isLoading,
  } = useQuery(
    ["competitionWithGroups", params.id],
    () => apiClient.competition.competitionGroupsDetail(Number(params.id)),
    {
      select: (data) => data.data as unknown as Competition,
      staleTime: 60000 * 30,
    }
  );

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
        groups={competition?.groups as Group[]}
        isLoading={isLoading}
      />
      {isLoading ? <div>Loading...</div> : children}
    </>
  );
}
