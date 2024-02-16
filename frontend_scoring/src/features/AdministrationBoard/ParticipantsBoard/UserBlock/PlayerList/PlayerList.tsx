import { List, ListSubheader } from "@mui/material";
import PlayerItem from "./PlayerItem";
import useGetParcipants from "../../../../../QueryHooks/useGetParticipants";
import { useSelector } from "react-redux";

export default function PlayerList() {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: participants, isFetching } = useGetParcipants(competitionID);
  if (!participants || isFetching) {
    return <></>;
  }
  let playerItems = [];

  for (let i = 0; i < participants.length; i++) {
    if (
      participants[i].role !== "player" ||
      participants[i].status !== "approved"
    )
      continue;

    playerItems.push(
      <PlayerItem key={i} participant={participants[i]}></PlayerItem>
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
