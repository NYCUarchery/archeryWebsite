import { useSelector } from "react-redux";
import BoardSwitch from "./BoardSwitch/BoardSwitch";
import GameTitle from "./GameTitle";

function TopBar() {
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);

  return (
    <div
      className="top_bar"
      style={{
        height: boardShown !== "score" ? "50px" : "150px",
      }}
    >
      <BoardSwitch></BoardSwitch>
      <GameTitle></GameTitle>
    </div>
  );
}

export default TopBar;
