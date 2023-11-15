import PlayerLists from "./PlayerLists/PlayerLists";
import GroupSelector from "./GroupSelector/GroupSelector";

export default function GroupsBoard() {
  return (
    <div className="groups_board">
      <GroupSelector />
      <PlayerLists />
    </div>
  );
}
