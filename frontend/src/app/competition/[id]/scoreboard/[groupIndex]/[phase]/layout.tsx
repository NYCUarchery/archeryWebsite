"use client";
import { PhaseEnums } from "enums/PhaseEnums";

export default function Layout({
  params,
  qualification,
  elimination,
}: {
  params: { id: string; phase: string };
  qualification: React.ReactNode;
  elimination: React.ReactNode;
}) {
  return params.phase === PhaseEnums.Qualification
    ? qualification
    : elimination;
}
