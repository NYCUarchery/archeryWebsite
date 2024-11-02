"use client";
import Header from "./Header";
import { useState } from "react";
import Sidebar from "./Sidebar";
import { Box } from "@mui/material";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: user, isFetched: isUserFetched } = useGetCurrentUserDetail();

  return (
    <>
      <Header
        setSideBarOpen={setSidebarOpen}
        user={user}
        isUserFetched={isUserFetched}
      />
      <Sidebar setSideBarOpen={setSidebarOpen} sideBarOpen={sidebarOpen} />
      <Box
        sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        {children}
      </Box>
    </>
  );
}
