import ArrowsPerEndsSetter from "./ArrowsPerEndSetter";
import EndsSetter from "./EndsSetter";
import GroupsMenu from "./GroupsMenu/GroupsMenu";
import LanesSetter from "./LanesSetter";
import RoundSetter from "./RoundsSetter";

export default function QualifcationBoard() {
  return (
    <div className="qualification_board">
      <GroupsMenu />
      <RoundSetter />
      <EndsSetter />
      <ArrowsPerEndsSetter />
      <LanesSetter />
    </div>
  );
}
