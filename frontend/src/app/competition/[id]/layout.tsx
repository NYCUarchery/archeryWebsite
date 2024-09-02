"use client";
import GameTitleBar from "@/components/GameTitleBar/GameTitleBar";
import SubGamesBar from "@/components/SubGameBar/SubGamesBar";
import { Competition, Group } from "@/types/oldRef/Competition";
import { apiClient } from "@/utils/ApiClient";
import { useQuery, useQueryClient } from "react-query";

export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const queryClient = useQueryClient();
  const user: any = queryClient.getQueryData("currentUser");
  const {
    data: competition,
    isError,
    isLoading,
  } = useQuery(
    ["competitionWithGroups", params.id],
    () => apiClient.competition.competitionGroupsDetail(Number(params.id)),
    {
      select: (data) => data.data as unknown as Competition,
      staleTime: 5000,
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
