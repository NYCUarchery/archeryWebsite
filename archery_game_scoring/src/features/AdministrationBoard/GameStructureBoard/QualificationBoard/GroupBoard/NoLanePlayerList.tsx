import { List, Paper } from "@mui/material";
import PlayerItem from "./LanePlayerList/PlayerItem";
import { useDispatch, useSelector } from "react-redux";
import { setPlayerLane } from "../../../GroupsBoard/groupsBoardSlice";

interface Props {
  players: Player[];
}
interface Player {
  id: number;
  name: string;
}

export default function NoLanePlayerList({ players }: Props) {
  const dispatch = useDispatch();
  const selectedPlayerId = useSelector(
    (state: any) => state.qualificationStructureGroupBoard.selectedPlayerId
  );
  const groupShown = useSelector(
    (state: any) => state.qualificationStructureGroupMenu.groupShown
  );

  const handleClick = (_event: React.MouseEvent) => {
    dispatch(
      setPlayerLane({
        groupId: groupShown,
        playerId: selectedPlayerId,
        lane: 0,
      })
    );
  };

  let items = [];

  for (let i = 0; i < players.length; i++) {
    items.push(
      <PlayerItem
        key={players[i].id}
        id={players[i].id}
        name={players[i].name}
      ></PlayerItem>
    );
  }

  return (
    <List sx={{ width: "25%" }}>
      <Paper sx={{ textAlign: "center" }} onClick={handleClick}>
        No Lane Player
      </Paper>
      {items}
    </List>
  );
}
