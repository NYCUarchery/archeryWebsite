import { useQuery, useQueryClient } from "react-query";

import { apiClient } from "@/utils/ApiClient";
import { useGetUserId } from "./useGetUserID";

export function useGetCurrentUserDetail() {
  const { data: id, isError, isFetching } = useGetUserId();
  const queryClient = useQueryClient();

  if (isError) {
    queryClient.setQueryData(["currentUserDetail"], undefined);
    queryClient.setQueryData(["currentUserId"], undefined);
  }

  return useQuery(["currentUserDetail"], () => apiClient.user.userDetail(id!), {
    select: (data) => data.data,
    retry: false,
    enabled: !isFetching,
    staleTime: Infinity,
  });
}

export function useGetCurrentUserDetailCache() {
  const queryClient = useQueryClient();
  return (queryClient.getQueryData("currentUserDetail") as any)?.data;
}
