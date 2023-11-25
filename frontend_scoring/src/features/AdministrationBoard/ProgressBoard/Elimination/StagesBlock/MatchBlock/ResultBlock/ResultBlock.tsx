import { Box, List, ListItem, ListSubheader } from "@mui/material";
import useGetPlayerSetWithPlayers from "../../../../../../../QueryHooks/useGetPlayerSetWithPlayers";
import PlayerLight from "./PlayerLight";
interface Props {
  result: any;
}

export default function ResultBlock({ result }: Props) {
  const { data: playerSet, isLoading } = useGetPlayerSetWithPlayers(
    result.player_set_id
  );

  if (isLoading) return <></>;
  let playerLights = [];

  for (let i = 0; i < result.match_ends.length; i++) {
    const end = result.match_ends[i];
    playerLights.push(
      <PlayerLight
        key={i}
        index={i + 1}
        isConfirmed={end.is_confirmed}
      ></PlayerLight>
    );
  }

  const subheader = <ListSubheader>{playerSet.set_name}</ListSubheader>;

  return (
    <Box>
      <List subheader={subheader}>
        <ListItem key={0}>{playerLights}</ListItem>
      </List>
    </Box>
  );
}
