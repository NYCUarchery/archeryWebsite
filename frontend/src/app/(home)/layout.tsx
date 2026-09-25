"use client";
import Header from "./Header";
import { Box } from "@mui/material";
import { useGetCurrentUserDetail } from "@/utils/QueryHooks/useGetCurrentUserDetail";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isFetched: isUserFetched } = useGetCurrentUserDetail();

  return (
    <Box className="home-shell">
      <a className="home-skip-link" href="#main-content">
        跳至主要內容
      </a>
      <Header user={user} isUserFetched={isUserFetched} />
      <Box component="main" id="main-content" className="home-main">
        {children}
      </Box>
      <Box component="footer" className="home-footer">
        <Box className="home-footer-inner">
          <strong>NYCU Archery System</strong>
          <span>國立陽明交通大學射箭系統</span>
        </Box>
      </Box>
    </Box>
  );
}
