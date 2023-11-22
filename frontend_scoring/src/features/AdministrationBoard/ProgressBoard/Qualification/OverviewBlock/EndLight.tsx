import { Avatar, Grid } from "@mui/material";

interface Props {
  index: number;
  status: "ended" | "ongoing" | "upcoming";
}

export default function EndLight({ index, status }: Props) {
  let color;

  switch (status) {
    case "ended":
      color = "#1bdc1b";
      break;
    case "ongoing":
      color = "orange";
      break;
    case "upcoming":
      color = "#dc1b1b";
      break;
    default:
      color = "white";
      break;
  }

  return (
    <Grid item xs={2}>
      <Avatar
        sx={{
          width: "30px",
          height: "30px",
          fontSize: "15px",
          backgroundColor: color,
          color: "white",
        }}
      >
        {index + 1}
      </Avatar>
    </Grid>
  );
}
