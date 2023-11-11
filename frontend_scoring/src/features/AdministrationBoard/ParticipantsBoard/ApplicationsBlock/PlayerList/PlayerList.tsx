import { List, ListSubheader } from "@mui/material";
import { useSelector } from "react-redux";
import PlayerItem from "./PlayerItem";

export default function PlayerList() {
  const playerApplications = useSelector(
    (state: any) => state.participants.playerApplications
  );

  let applications: any[] = [];
  for (let i = 0; i < playerApplications.length; i++) {
    const application = playerApplications[i];
    applications.push(
      <PlayerItem
        key={i}
        id={application.id}
        name={application.name}
        index={i}
      ></PlayerItem>
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
