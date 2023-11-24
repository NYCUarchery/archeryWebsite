import useGetPlayerSetWithPlayers from "../../../../../QueryHooks/useGetPlayerSetWithPlayers";
import {
  ListItem,
  ListItemText,
  List,
  ListSubheader,
  Chip,
  Divider,
} from "@mui/material";
import DeleteButton from "./DeleteButton";

interface Props {
  playerSetID: any;
}

export default function TeamBlock({ playerSetID }: Props) {
  const { data: playerSet } = useGetPlayerSetWithPlayers(playerSetID);

  if (!playerSet) return <></>;

  let playerBlocks = [];

  for (let i = 0; i < playerSet.players.length; i++) {
    const player = playerSet.players[i];
    playerBlocks[i] = (
      <>
        <Divider></Divider>
        <ListItem
          sx={{
            height: "60px",
          }}
        >
          <ListItemText>{player.name}</ListItemText>
          <Chip label={player.total_score} />
        </ListItem>
      </>
    );
  }

  return (
    <List
      subheader={
        <ListSubheader>
          {playerSet.set_name}
          <Chip label={playerSet.rank} />
          <DeleteButton
            setID={playerSet.id}
            eliminationID={playerSet.elimination_id}
          ></DeleteButton>
        </ListSubheader>
      }
    >
      {playerBlocks}
    </List>
  );
}
