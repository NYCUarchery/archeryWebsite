import { Box, List, Paper } from "@mui/material";
import PlayerItem from "./PlayerItem";
import { useDispatch, useSelector } from "react-redux";
import { setPlayerLane } from "../../../../GroupsBoard/groupsBoardSlice";

interface Props {
  laneNum: number;
  players: Player[];
}
interface Player {
  id: number;
  name: string;
}

export default function LanePlayerList({ laneNum, players }: Props) {
  const dispatch = useDispatch();

  const selectedPlayerId = useSelector(
    (state: any) => state.qualificationStructureGroupBoard.selectedPlayerId
  );
  const groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );

  const handleClick = (_event: React.MouseEvent) => {
    dispatch(
      setPlayerLane({
        groupId: groupShown,
        playerId: selectedPlayerId,
        lane: laneNum,
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
    <Box>
      <Paper
        sx={{
          textAlign: "center",
        }}
        onClick={handleClick}
      >
        {laneNum}
      </Paper>
      <List>{items}</List>
    </Box>
  );
}
