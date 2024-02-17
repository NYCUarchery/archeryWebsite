import { List } from "@mui/material";
import PlayerItem from "./PlayerItem";

interface Props {
  players: any[];
}

export default function PlayerList({ players }: Props) {
  let items = [];

  for (let i = 0; i < players.length; i++) {
    items.push(<PlayerItem key={i} player={players[i]} />);
  }

  return (
    <List className="player_list" sx={{ maxHeight: "100%", overflow: "auto" }}>
      {items}
    </List>
  );
}
