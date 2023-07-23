import GroupList from "./GroupList/GroupList";
import PhaseList from "./PhaseList/PhaseList";

function SubGamesBar() {
  return (
    <div className="sub_game_bar">
      <GroupList></GroupList>
      <PhaseList></PhaseList>
    </div>
  );
}

export default SubGamesBar;
