"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** 舊管理記分入口已移至獨立裁判頁。 */
export default function LegacyQualificationScoreEditingPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/competition/${params.id}/judge`);
  }, [params.id, router]);
  return null;
}
