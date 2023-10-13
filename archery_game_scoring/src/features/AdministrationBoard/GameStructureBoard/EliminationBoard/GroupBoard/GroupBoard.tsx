import { Box, Grid } from "@mui/material";
import { useSelector } from "react-redux";
import EliminatiomInfo from "../../../../../jsons/EliminationInfo.json";
import TeamBlock from "./TeamBlock";

export default function GroupBoard() {
  let teamBlocks = [];
  let advancingNum = 16;
  let groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  groupShown--;

  for (let i = 0; i < advancingNum; i++) {
    let player;
    player = EliminatiomInfo.groups[groupShown].players[i];

    teamBlocks.push(
      <Grid item xs={3}>
        <TeamBlock teamIndex={i + 1} playersNum={1} players={[]}></TeamBlock>
      </Grid>
    );
  }

  for (let i = 0; i < EliminatiomInfo.groups[groupShown].players.length; i++) {
    let player = EliminatiomInfo.groups[groupShown].players[i];
    teamBlocks[i] = (
      <Grid item xs={3}>
        <TeamBlock
          teamIndex={i + 1}
          playersNum={1}
          players={[{ id: player.rank, name: player.name }]}
        ></TeamBlock>
      </Grid>
    );
  }

  return (
    <Box>
      <Grid container spacing={1}>
        {teamBlocks}
      </Grid>
    </Box>
  );
}
