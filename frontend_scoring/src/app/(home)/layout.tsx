"use client";
import Header from "./register/Header";
import { useState } from "react";
import Sidebar from "./Sidebar";
import { Box } from "@mui/material";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header setSideBarOpen={setSidebarOpen} />
      <Sidebar setSideBarOpen={setSidebarOpen} sideBarOpen={sidebarOpen} />
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        {children}
      </Box>
    </>
  );
}
