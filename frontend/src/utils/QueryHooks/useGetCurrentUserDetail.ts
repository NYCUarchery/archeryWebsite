import { useQuery } from "react-query";

import { apiClient } from "@/utils/ApiClient";
import { useGetUserId } from "./useGetUserID";

export function useGetCurrentUserDetail() {
  const { data: id, isFetching } = useGetUserId();
  return useQuery("currentUser", () => apiClient.user.userDetail(id!), {
    select: (data) => data.data,
    retry: false,
    enabled: !isFetching,
    staleTime: Infinity,
  });
}
