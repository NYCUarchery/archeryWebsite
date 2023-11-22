import { Grid } from "@mui/material";
import LaneBlock from "./LaneBlock";

export default function PlayerStatusBlock() {
  let items = [];
  for (let i = 0; i < 28; i++) {
    items.push(<LaneBlock index={i + 1} playerNum={4}></LaneBlock>);
  }

  return (
    <Grid container spacing={0}>
      {items}
    </Grid>
  );
}
