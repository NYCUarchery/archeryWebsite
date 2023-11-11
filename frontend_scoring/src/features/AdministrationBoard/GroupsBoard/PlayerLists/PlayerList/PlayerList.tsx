import { ButtonGroup } from "@mui/material";
import PlayerItem from "./PlayerItem";

interface Props {
  groupId: number;
  players: Player[];
}

interface Player {
  name: string;
  id: number;
}

export default function PlayerList({ players, groupId }: Props) {
  let items = [];

  for (let i = 0; i < players.length; i++) {
    items.push(
      <PlayerItem
        key={i}
        name={players[i].name}
        id={players[i].id}
        index={i}
        groupId={groupId}
      />
    );
  }

  return (
    <ButtonGroup className="player_list" variant="text" orientation="vertical">
      {items}
    </ButtonGroup>
  );
}
