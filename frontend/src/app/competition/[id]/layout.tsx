"use client";
import GameTitleBar from "@/components/GameTitleBar/GameTitleBar";
import { Competition } from "@/types/oldRef/Competition";
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
    ["competition", params.id],
    () => apiClient.competition.competitionDetail(Number(params.id)),
    {
      select: (data) => data.data as unknown as Competition,
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
      {children}
    </>
  );
}
