import { Box, List, ListSubheader } from "@mui/material";
import RoundBlock from "./RoundBlock";

interface Props {
  elimination: any;
}

export default function OverviewBlock({ elimination }: Props) {
  const stageNum = elimination.stages.length;
  const teamSize = elimination.team_size;
  const currentEnd = elimination.current_end;

  let roundBlocks = [];
  for (let i = 0; i < stageNum; i++) {
    roundBlocks.push(
      <RoundBlock
        index={i}
        currentEnd={currentEnd}
        teamSize={teamSize}
      ></RoundBlock>
    );
  }

  return (
    <Box>
      <List subheader={<ListSubheader>Overview</ListSubheader>}>
        {roundBlocks}
      </List>
    </Box>
  );
}
