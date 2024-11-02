"use client";
import { useMutation } from "react-query";
import { apiClient } from "@/utils/ApiClient";
import { useRouter } from "next/navigation";
import { useQueryClient } from "react-query";

export default function LogoutPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  let text = "登出中...";
  const { mutate } = useMutation(
    () => apiClient.session.sessionDelete({ withCredentials: true }),
    {
      onSuccess: () => {
        text = "登出成功";
        queryClient.setQueryData(["currentUserDetail"], undefined);
        queryClient.setQueryData(["currentUserId"], undefined);
        router.push("/");
      },
    }
  );
  mutate();

  return <div>{text}</div>;
}
