import ArrowsNumPerEndSetter from "./ArrowsNumPerEndSetter";
import EndsSetter from "./EndsSetter";
import GroupsMenu from "./GroupsMenu/GroupsMenu";
import LanesSetter from "./LanesSetter";
import PlayersNumPerLaneSetter from "./PlayersNumPerLaneSetter";
import RoundSetter from "./RoundsSetter";

export default function QualifcationBoard() {
  return (
    <div className="qualification_board">
      <GroupsMenu />
      <RoundSetter />
      <EndsSetter />
      <ArrowsNumPerEndSetter />
      <LanesSetter />
      <PlayersNumPerLaneSetter />
    </div>
  );
}
