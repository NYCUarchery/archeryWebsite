"use client";
import { PhaseEnums } from "enums/PhaseEnums";

export default function Layout({
  params,
  qualification,
}: {
  params: { id: string; phase: string };
  qualification: React.ReactNode;
}) {
  return params.phase === PhaseEnums.Qualification ? qualification : <></>;
}
