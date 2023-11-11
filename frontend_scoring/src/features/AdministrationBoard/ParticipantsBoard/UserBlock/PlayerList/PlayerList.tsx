import { List, ListSubheader } from "@mui/material";
import PlayerItem from "./PlayerItem";
import { useSelector } from "react-redux";

export default function PlayerList() {
  const players = useSelector((state: any) => state.participants.players);

  let playerItems = [];

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    playerItems.push(
      <PlayerItem
        key={i}
        id={player.id}
        name={player.name}
        index={i}
      ></PlayerItem>
    );
  }

  return (
    <List
      subheader={<ListSubheader>選手</ListSubheader>}
      className="player_list"
    >
      {playerItems}
    </List>
  );
}
