import {
  ListItem,
  ListItemText,
  List,
  ListSubheader,
  Chip,
  Divider,
} from "@mui/material";

interface Props {
  teamIndex: number;
  playersNum: number;
  players: Player[];
}

interface Player {
  id: number;
  name: string;
}

export default function TeamBlock({ teamIndex, playersNum, players }: Props) {
  let playerBlocks = [];

  for (let i = 0; i < playersNum; i++) {
    playerBlocks.push(
      <>
        <Divider></Divider>
        <ListItem
          sx={{
            height: "60px",
          }}
        >
          <ListItemText></ListItemText>
        </ListItem>
      </>
    );
  }

  for (let i = 0; i < players.length; i++) {
    playerBlocks[i] = (
      <>
        <Divider></Divider>
        <ListItem
          sx={{
            height: "60px",
          }}
        >
          <ListItemText>{players[i].name}</ListItemText>
          <Chip label={players[i].id} />
        </ListItem>
      </>
    );
  }

  return (
    <List subheader={<ListSubheader>{teamIndex}</ListSubheader>}>
      {playerBlocks}
    </List>
  );
}
