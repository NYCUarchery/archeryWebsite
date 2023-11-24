import { Box, Grid } from "@mui/material";
import TeamBlock from "./TeamBlock";
import useGetPlayerSets from "../../../../../QueryHooks/useGetPlayerSets";

interface Props {
  eliminationID: number;
}

export default function GroupBoard({ eliminationID }: Props) {
  const { data: playerSets } = useGetPlayerSets(eliminationID);

  if (!playerSets) return <></>;

  let teamBlocks = [];

  for (let i = 0; i < playerSets.length; i++) {
    teamBlocks.push(
      <Grid item xs={3}>
        <TeamBlock playerSetID={playerSets[i].id}></TeamBlock>
      </Grid>
    );
  }

  return (
    <Box sx={{ minWidth: "800px" }}>
      <Grid container spacing={1}>
        {teamBlocks}
      </Grid>
    </Box>
  );
}
