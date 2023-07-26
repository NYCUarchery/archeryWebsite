import BoardSwitch from "./BoardSwitch/BoardSwitch";
import GameTitle from "./GameTitle";

function TopBar() {
  return (
    <div className="top_bar">
      <BoardSwitch></BoardSwitch>
      <GameTitle></GameTitle>
    </div>
  );
}

export default TopBar;
