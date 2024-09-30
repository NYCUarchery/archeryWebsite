"use client";
import { Participant } from "@/types/oldRef/Participant";
import { apiClient } from "../ApiClient";
import { useQuery } from "react-query";

export default function useGetCurrentParticipentDetail(
  userId: number | undefined
) {
  return useQuery(
    "currentParticipent",
    () => apiClient.participant.competitionDetail(userId ?? -1),
    {
      select: (data) => data.data[0] as unknown as Participant,
      enabled: !!userId,
      retry: false,
      staleTime: Infinity,
    }
  );
}
