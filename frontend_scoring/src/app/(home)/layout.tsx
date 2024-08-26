"use client";
import Header from "./Header";
import { useState } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [_sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header setSideBarOpen={setSidebarOpen} />
      {children}
    </>
  );
}
