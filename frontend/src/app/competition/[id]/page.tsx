"use client";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export default function Page() {
  const router = useRouter();
  router.push(usePathname() + "/scoreboard/0/qualification");
  return <></>;
}
