import { useQuery } from "react-query";
import { apiClient } from "../ApiClient";

export function useGetUserId() {
  return useQuery(["currentUser", "id"], apiClient.user.getUser, {
    select: (data) => data.data.id,
    retry: false,
  });
}
