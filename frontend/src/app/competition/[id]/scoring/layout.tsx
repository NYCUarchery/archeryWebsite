"use client";

import { Box } from "@mui/material";

export default function Layout({
  qualification,
}: {
  qualification: React.ReactNode;
}) {
  return (
    <Box className="recording_board" sx={{ maxWidth: "400px" }}>
      {qualification}
    </Box>
  );
}
