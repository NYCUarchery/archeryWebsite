import { List } from "@mui/material";
import PlayerItem from "./PlayerItem";

interface Props {
  players: Player[];
}

interface Player {
  name: string;
  id: number;
}

export default function PlayerList({ players }: Props) {
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

  return <List className="player_list">{items}</List>;
}
