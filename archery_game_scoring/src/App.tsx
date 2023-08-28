import TopBar from "./features/Screen/TopBar/TopBar";
import "./style/App.scss";
import SubGamesBar from "./features/Screen/SubGameBar/SubGamesBar";
import BottomBar from "./features/Screen/BottomBar/BottomBar";
import ScoreBoard from "./features/ScoreBoard/ScoreBoard";
import RecordingBoard from "./features/RecordingBoard/RecordingBoard";
import AdministrationBoard from "./features/AdministrationBoard/AdministrationBoard";
import { useSelector } from "react-redux/es/hooks/useSelector";

function App() {
  const boardShown = useSelector((state: any) => state.boardSwitch.boardShown);
  let board: any;

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
      {board}
      <BottomBar />
    </div>
  );
}

export default App;
