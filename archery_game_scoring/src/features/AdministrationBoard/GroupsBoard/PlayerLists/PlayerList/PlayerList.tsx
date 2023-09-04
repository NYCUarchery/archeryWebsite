import { List, ListSubheader } from "@mui/material";
import PlayerItem from "./PlayerItem";

interface Props {
  groupName: string;
  players: Player[];
}

interface Player {
  name: string;
  id: number;
}

export default function PlayerList({ groupName, players }: Props) {
  let items = [];

  for (let i = 0; i < players.length; i++) {
    items.push(
      <PlayerItem
        key={players[i].id}
        name={players[i].name}
        id={players[i].id}
      />
    );
  }

  return (
    <List className="player_list">
      <ListSubheader className="player_list_subheader">
        {groupName}
      </ListSubheader>
      {items}
    </List>
  );
}
