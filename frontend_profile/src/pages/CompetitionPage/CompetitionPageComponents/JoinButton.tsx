import React from "react";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

const JoinButton = ({ onJoin }: { onJoin: any }) => (
  <Grid container justifyContent="center">
    <Grid item sx={{ width: "70%" }}>
      <Button
        variant="text"
        sx={{ color: "#2074d4", width: "100%" }}
        onClick={onJoin}
      >
        <Typography variant="body1" component="div">
          立即報名
        </Typography>
      </Button>
    </Grid>
  </Grid>
);

export default JoinButton;
