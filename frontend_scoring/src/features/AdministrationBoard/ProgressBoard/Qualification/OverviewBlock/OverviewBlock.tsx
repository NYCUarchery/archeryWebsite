import { Box, List, ListSubheader } from "@mui/material";
import RoundBlock from "./RoundBlock";

export default function OverviewBlock() {
  let roundBlocks = [];
  for (let i = 0; i < 2; i++) {
    roundBlocks.push(<RoundBlock index={i}></RoundBlock>);
  }

  return (
    <Box>
      <List subheader={<ListSubheader>Overview</ListSubheader>}>
        {roundBlocks}
      </List>
    </Box>
  );
}
