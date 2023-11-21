import PlayerLists from "./PlayerLists/PlayerLists";
import GroupSelector from "./GroupSelector/GroupSelector";
import { useSelector } from "react-redux";
import useGetGroupsWithPlayers from "../../../QueryHooks/useGetGroupsWithPlayers";
import GroupCreator from "./GroupCreator";
import { ButtonGroup } from "@mui/material";
import DeleteGroupButton from "./DeleteGroupButton";
import DeletePlayerButton from "./DeletePlayerButton";

export default function GroupsBoard() {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const {
    data: groups,
    isError,
    isLoading,
  } = useGetGroupsWithPlayers(competitionID);
  if (isLoading) {
    return <h1>Is Loading...</h1>;
  }
  if (isError) {
    <h1>Error la... QQ</h1>;
  }

  return (
    <div className="groups_board">
      <GroupSelector groups={groups} />
      <PlayerLists groups={groups} />
      <ButtonGroup>
        <GroupCreator></GroupCreator>
        <DeleteGroupButton></DeleteGroupButton>
        <DeletePlayerButton></DeletePlayerButton>
      </ButtonGroup>
    </div>
  );
}
