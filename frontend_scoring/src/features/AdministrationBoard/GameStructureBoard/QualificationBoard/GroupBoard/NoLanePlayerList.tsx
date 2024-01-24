import { List, ListSubheader } from "@mui/material";
import PlayerItem from "./LanePlayerList/PlayerItem";
import useGetCompetition from "../../../../../QueryHooks/useGetCompetition";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient, useMutation } from "react-query";
import useGetGroupsWithPlayers from "../../../../../QueryHooks/useGetGroupsWithPlayers";
import axios from "axios";
import { setSelectedPlayerId } from "./groupBoardSlice";
import { Player } from "../../../../../QueryHooks/types/Player";
const putPlayerLaneID = ({ playerID, laneID }: any) => {
  return axios.put(`/api/player/lane/${playerID}`, { lane_id: laneID });
};

const putPlayerOrder = ({ playerID, order }: any) => {
  return axios.put(`/api/player/order/${playerID}`, { order: order });
};

export default function NoLanePlayerList() {
  const dispatch = useDispatch();
  const selectedPlayerId = useSelector(
    (state: any) => state.qualificationStructureGroupBoard.selectedPlayerId
  );
  const groupShown = useSelector(
    (state: any) => state.gameStructureGroupMenu.groupShown
  );
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: competition } = useGetCompetition(competitionID);

  const { data: groups } = useGetGroupsWithPlayers(competitionID);
  const queryClient = useQueryClient();
  const { mutate: setPlayerLaneID } = useMutation(putPlayerLaneID, {
    onSuccess: () => {
      queryClient.invalidateQueries("qualificationWithLanesPlayers");
      queryClient.invalidateQueries("groupsWithPlayers");
    },
  });
  const { mutate: setPlayerOrder } = useMutation(putPlayerOrder);
  const handleClick = (_event: any) => {
    if (selectedPlayerId === null) return;
    setPlayerLaneID({
      playerID: selectedPlayerId,
      laneID: competition?.unassigned_lane_id,
    });
    setPlayerOrder({ playerID: selectedPlayerId, order: 0 });
    dispatch(setSelectedPlayerId(null));
  };
  if (!groups || !competition) {
    return <></>;
  }

  let items = [];
  const players = groups.find((e: any) => e.id == groupShown)
    ?.players as Player[];

  for (let i = 0; i < players.length; i++) {
    if (players[i].lane_id !== competition.unassigned_lane_id) continue;
    items.push(
      <PlayerItem
        key={players[i].id}
        player={players[i]}
        order={0}
      ></PlayerItem>
    );
  }

  return (
    <List
      sx={{ width: "25%", height: "100%", backgroundColor: "#f2f2f2" }}
      onClick={handleClick}
    >
      <ListSubheader>無靶道</ListSubheader>
      {items}
    </List>
  );
}
