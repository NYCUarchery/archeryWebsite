import TopBar from "./features/Screen/TopBar/TopBar";
import "./style/App.scss";
import SubGamesBar from "./features/Screen/SubGameBar/SubGamesBar";
import BottomBar from "./features/Screen/BottomBar/BottomBar";
import ScoreBoard from "./features/ScoreBoard/ScoreBoard";
import RecordingBoard from "./features/RecordingBoard/RecordingBoard";
import AdministrationBoard from "./features/AdministrationBoard/AdministrationBoard";
import { useSelector } from "react-redux/es/hooks/useSelector";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { initialize } from "./features/States/gameSlice";

function App() {
  const { competitionID } = useParams();
  const dispatch = useDispatch();
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);
  let board: any;
  dispatch(initialize({ competitionID }));

  switch (boardShown) {
    case "score":
      board = <ScoreBoard></ScoreBoard>;
      break;
    case "recording":
      board = <RecordingBoard></RecordingBoard>;
      break;
    case "administration":
      board = <AdministrationBoard></AdministrationBoard>;
      break;
  }

  return (
    <div>
      <TopBar />
      <SubGamesBar />
      <div className="board">{board}</div>
      <BottomBar />
    </div>
  );
}

export default App;
