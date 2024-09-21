import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";

export default function ToCreateButton() {
  const router = useRouter();

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container justifyContent="center">
        <Grid>
          <Button
            variant="text"
            onClick={() => router.push("/create_competition")}
            sx={{ color: "#2074d4" }}
          >
            <Typography variant="h6" component="div">
              創建新的比賽
            </Typography>
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
