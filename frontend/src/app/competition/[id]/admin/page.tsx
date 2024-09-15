"use client";
import { usePathname, useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const currentPath = usePathname();
  router.push(currentPath + "/main");
  return <></>;
}
