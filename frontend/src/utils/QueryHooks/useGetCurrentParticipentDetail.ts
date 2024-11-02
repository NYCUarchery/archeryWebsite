"use client";
import { apiClient } from "../ApiClient";
import { useQuery } from "react-query";

export default function useGetCurrentParticipentDetail(
  competitionId: number | undefined,
  userId: number | undefined
) {
  return useQuery(
    "currentParticipent",
    () => apiClient.participant.competitionUserDetail(competitionId!, userId!),
    {
      select: (data) => data.data[0],
      enabled: !!userId && !!competitionId,
      retry: false,
      staleTime: Infinity,
    }
  );
}
