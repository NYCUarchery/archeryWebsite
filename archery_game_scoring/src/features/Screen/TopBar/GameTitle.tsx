import { useSelector } from "react-redux";
import GameInfo from "../../../jsons/GameInfo.json";

function GameTitle() {
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);

  return (
    <div className="game_title">
      <span
        className="game_main_title"
        style={{
          fontSize: boardShown !== "score" ? "30px" : "50px",
        }}
      >
        {GameInfo.title}
      </span>

      <br />
      {boardShown !== "score" ? null : (
        <span className="game_subtitle">{GameInfo.sub_title}</span>
      )}
    </div>
  );
}

export default GameTitle;
