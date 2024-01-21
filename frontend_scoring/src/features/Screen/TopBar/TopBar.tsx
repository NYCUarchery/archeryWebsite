import { useSelector } from "react-redux";
import BoardMenu from "./BoardMenu/BoardMenu";
import GameTitle from "./GameTitle";
import UserNamePrompt from "./UserNamePrompt";

function TopBar() {
  const boardShown = useSelector((state: any) => state.boardMenu.boardShown);

  return (
    <div
      className="top_bar"
      style={{
        height: boardShown !== "score" ? "50px" : "150px",
      }}
    >
      <UserNamePrompt />
      <BoardMenu></BoardMenu>
      <GameTitle></GameTitle>
    </div>
  );
}

export default TopBar;
