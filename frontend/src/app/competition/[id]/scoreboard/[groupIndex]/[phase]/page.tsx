"use client";
import { Box } from "@mui/material";

export default function Page({
  params,
}: {
  params: { id: string; groupIndex: string; phase: string };
}) {
  return <Box>{params.phase}</Box>;
}
