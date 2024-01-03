import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import routing from "../../../util/routing";
import React from "react";

const CreateContestButton = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container justifyContent="center">
        <Grid item>
          <Button
            variant="text"
            onClick={() => navigate(routing.CreateContest)}
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
};
export default CreateContestButton;
