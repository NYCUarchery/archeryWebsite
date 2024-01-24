import { Box, List, Paper } from "@mui/material";
import PlayerItem from "./PlayerItem";
import { useDispatch, useSelector } from "react-redux";
import { setPlayerLane } from "../../../../GroupsBoard/groupsBoardSlice";
import useGetGroupsWithPlayers from "../../../../../../QueryHooks/useGetGroupsWithPlayers";
import PlayerSlot from "./PlayerSlot";
import { Group } from "../../../../../../QueryHooks/types/Competition";

interface Props {
  laneNum: number;
  laneID: number;
}

export default function LanePlayerList({ laneNum, laneID }: Props) {
  const dispatch = useDispatch();

  const competitionID = useSelector((state: any) => state.game.competitionID);
  const selectedPlayerId = useSelector(
    (state: any) => state.qualificationStructureGroupBoard.selectedPlayerId
  );
  const groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  const { data: groups } = useGetGroupsWithPlayers(competitionID);
  if (!groups) return <></>;
  const group = groups.find((e: any) => e.id == groupShown) as Group;

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
  const players = group.players.filter((e: any) => e.lane_id === laneID);
  for (let i = 1; i <= 4; i++) {
    items.push(<PlayerSlot key={i} order={i} laneID={laneID}></PlayerSlot>);
  }
  for (let i = 0; i < players.length; i++) {
    const player = players[i];

    items[player.order - 1] = (
      <PlayerItem
        key={player.order}
        player={player}
        order={player.order}
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
