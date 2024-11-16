import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";

export function useGetUserId() {
  return useQuery(
    ["currentUserId"],
    () => apiClient.user.getUser({ withCredentials: true }),
    {
      select: (data) => data.data.id,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: Infinity,
    }
  );
}
