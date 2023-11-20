import { List, ListSubheader } from "@mui/material";
import { useSelector } from "react-redux";
import PlayerItem from "./PlayerItem";
import useGetParcipants from "../../../../../QueryHooks/useGetParticipants";

export default function PlayerList() {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: participants, isFetching } = useGetParcipants(competitionID);
  if (isFetching) {
    return <></>;
  }
  let applications = [];

  for (let i = 0; i < participants.length; i++) {
    if (
      participants[i].role !== "player" ||
      participants[i].status !== "pending"
    )
      continue;

    applications.push(
      <PlayerItem key={i} participant={participants[i]}></PlayerItem>
    );
  }

  return (
    <List
      className="player_list"
      subheader={<ListSubheader>選手申請</ListSubheader>}
    >
      {applications}
    </List>
  );
}
