"use client";
import { Participant } from "@/types/oldRef/Participant";
import { apiClient } from "../ApiClient";
import { useQuery } from "react-query";

export default function useGetCurrentParticipentDetail(
  userId: number | undefined,
  competitionId: number
) {
  return useQuery(
    "currentParticipent",
    () =>
      apiClient.participant.competitionUserList(userId ?? -1, competitionId),
    {
      select: (data) => data.data[0] as unknown as Participant,
      enabled: !!userId,
      retry: false,
      staleTime: Infinity,
    }
  );
}
