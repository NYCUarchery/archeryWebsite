import { Box, List, ListSubheader } from "@mui/material";
import RoundBlock from "./RoundBlock";
import useGetCompetition from "../../../../../QueryHooks/useGetCompetition";
import { useSelector } from "react-redux";

export default function OverviewBlock() {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: competition, isLoading } = useGetCompetition(competitionID);
  if (isLoading) return <></>;

  const currentEnd = competition.qualification_current_end;

  let roundBlocks = [];
  for (let i = 0; i < competition.rounds_num; i++) {
    roundBlocks.push(
      <RoundBlock index={i} currentEnd={currentEnd}></RoundBlock>
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
